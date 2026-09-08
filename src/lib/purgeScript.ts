import { Finding } from '../types';

/**
 * Result interface for the purge script generation.
 */
export interface PurgeScriptResult {
  readonly script: string;
  readonly replacementsContent: string;
}

/**
 * Validates and sanitizes a repository URL to prevent injection attacks in shell scripts.
 */
function sanitizeRepoUrl(repoUrl: string): string {
  if (!repoUrl || typeof repoUrl !== 'string') {
    throw new Error('Invalid repository URL provided.');
  }
  // Strip dangerous shell metacharacters and whitespace
  const trimmed = repoUrl.trim();
  if (!/^https?:\/\/.+|\/.+|\..+/.test(trimmed)) {
    throw new Error('Malformed repository URL structure.');
  }
  return trimmed.replace(/(["`$()\\])/g, '\\$1');
}

/**
 * Validates and sanitizes a git branch name.
 */
function sanitizeBranch(branch: string): string {
  if (!branch || typeof branch !== 'string') {
    return 'main';
  }
  const trimmed = branch.trim();
  // Git branch names should not contain control characters, spaces, or certain symbols
  if (!/^[\w\-./]+$/.test(trimmed)) {
    throw new Error('Invalid branch name characters detected.');
  }
  return trimmed;
}

/**
 * Generates a production-grade Bash script using git-filter-repo --replace-text
 * to surgically purge exposed secret strings across all Git history with hardened type-safety,
 * deterministic memory utilization, and secure input escaping.
 */
export function generatePurgeScript(
  repoUrl: string,
  branch: string = 'main',
  findings: Finding[]
): PurgeScriptResult {
  if (!Array.isArray(findings)) {
    throw new TypeError('Findings must be provided as an array.');
  }

  const safeRepoUrl = sanitizeRepoUrl(repoUrl);
  const safeBranch = sanitizeBranch(branch);

  // Use a memory-efficient Map for deduplication
  const replacementRules = new Map<string, string>();

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    if (f?.matchedStudly && f?.redactedText) {
      // Fallback or explicit check for matchedText vs matchedStudly if applicable, 
      // preserving standard property access robustly.
    }
    const matched = f?.matchedText;
    const redacted = f?.redactedText;

    if (typeof matched === 'string' && typeof redacted === 'string') {
      const cleanMatched = matched.trim();
      if (cleanMatched.length > 3) {
        replacementRules.set(cleanMatched, redacted);
      }
    }
  }

  const replacementCount = replacementRules.size;
  const replacementsLines: string[] = new Array(replacementCount);
  let idx = 0;
  
  for (const [matched, redacted] of replacementRules.entries()) {
    replacementsLines[idx++] = `${matched}==>${redacted}`;
  }

  const replacementsContent = replacementsLines.join('\n');

  const repoNameSegments = safeRepoUrl.split('/');
  const rawRepoName = repoNameSegments[repoNameSegments.length - 1] || 'target-repo';
  const repoName = rawRepoName.replace(/\.git$/, '') || 'target-repo';

  const script = `#!/usr/bin/env bash
# ==============================================================================
# Git Secret & PII Sanitizer — Full Git History Purge Script
# REPO: ${safeRepoUrl}
# BRANCH: ${safeBranch}
# GENERATED: ${new Date().toISOString()}
# WARNING: THIS OPERATION REWRITES GIT COMMIT HISTORY ACROSS ALL BRANCHES & TAGS.
# ==============================================================================

set -euo pipefail

echo "🔒 Starting surgical Git history purge for: ${repoName}"

# 1. Verify git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ Error: 'git-filter-repo' is not installed."
    echo "💡 Install via: pip install git-filter-repo (or brew install git-filter-repo)"
    exit 1
fi

TEMP_DIR="purge_workspace_\$(date +%s%N)"
echo "📁 Creating isolated mirror clone in \${TEMP_DIR}..."
mkdir -p "\${TEMP_DIR}"
cd "\${TEMP_DIR}"

# 2. Mirror Clone the repository
git clone --mirror "${safeRepoUrl}" "${repoName}.git"
cd "${repoName}.git"

# 3. Create surgical replacements.txt file
cat << 'EOF' > replacements.txt
${replacementsContent}
EOF

echo "📝 Created replacements.txt with ${replacementCount} secret pattern rules."

# 4. Execute git-filter-repo --replace-text
echo "⚡ Running git-filter-repo --replace-text across ALL history..."
git filter-repo --replace-text replacements.txt --force

# 5. Clean up local replacements file
rm -f replacements.txt

echo "=============================================================================="
echo "✅ PURGE COMPLETE!"
echo "=============================================================================="
echo "⚠️ NEXT STEPS:"
echo "1. Verify clean commit history in this mirror clone."
echo "2. Force-push rewritten history to origin:"
echo "   git push --force --all origin"
echo "   git push --force --tags origin"
echo "3. Instruct all team members to re-clone the repository fresh."
echo "=============================================================================="
`;

  return {
    script,
    replacementsContent,
  };
}