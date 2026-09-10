import { Finding } from '../types';

/**
 * Result interface for the purge script generation.
 */
export interface PurgeScriptResult {
  readonly script: string;
  readonly replacementsContent: string;
}

const REPO_URL_PATTERN: RegExp = /^https?:\/\/.+|\/.+|\..+/;
const BRANCH_NAME_PATTERN: RegExp = /^[\w\-./]+$/;
const SHELL_ESCAPE_PATTERN: RegExp = /(["`$()\\])/g;
const GIT_EXTENSION_PATTERN: RegExp = /\.git$/;

/**
 * Validates and sanitizes a repository URL to prevent injection attacks in shell scripts.
 */
function sanitizeRepoUrl(repoUrl: string): string {
  if (typeof repoUrl !== 'string' || repoUrl.trim() === '') {
    throw new Error('Invalid repository URL provided.');
  }
  const trimmed: string = repoUrl.trim();
  if (!REPO_URL_PATTERN.test(trimmed)) {
    throw new Error('Malformed repository URL structure.');
  }
  return trimmed.replace(SHELL_ESCAPE_PATTERN, '\\$1');
}

/**
 * Validates and sanitizes a git branch name.
 */
function sanitizeBranch(branch: string): string {
  if (typeof branch !== 'string' || branch.trim() === '') {
    return 'main';
  }
  const trimmed: string = branch.trim();
  if (!BRANCH_NAME_PATTERN.test(trimmed)) {
    throw new Error('Invalid branch name characters detected.');
  }
  return trimmed;
}

/**
 * Generates a Bash script using git-filter-repo --replace-text
 * to purge exposed secret strings across Git history with type safety,
 * memory efficiency, and input escaping.
 */
export function generatePurgeScript(
  repoUrl: string,
  branch: string = 'main',
  findings: Finding[] = []
): PurgeScriptResult {
  if (!Array.isArray(findings)) {
    throw new TypeError('Findings must be provided as an array.');
  }

  const safeRepoUrl: string = sanitizeRepoUrl(repoUrl);
  const safeBranch: string = sanitizeBranch(branch);

  const replacementRules = new Map<string, string>();

  const len: number = findings.length;
  for (let i = 0; i < len; i++) {
    const f: Finding = findings[i];
    if (!f) {
      continue;
    }

    const matched: string = f.matchedText;
    const redacted: string = f.redactedText;

    if (typeof matched === 'string' && typeof redacted === 'string') {
      const cleanMatched: string = matched.trim();
      if (cleanMatched.length > 3) {
        const safeMatched: string = cleanMatched.replace(/[\r\n]/g, '');
        const safeRedacted: string = redacted.replace(/[\r\n]/g, '');
        if (safeMatched.length > 3) {
          replacementRules.set(safeMatched, safeRedacted);
        }
      }
    }
  }

  const replacementCount: number = replacementRules.size;
  const replacementsLines: string[] = new Array(replacementCount);
  let idx = 0;

  replacementRules.forEach((redacted: string, matched: string) => {
    replacementsLines[idx++] = `${matched}==>${redacted}`;
  });

  const replacementsContent: string = replacementsLines.join('\n');

  const repoNameSegments: string[] = safeRepoUrl.split('/');
  const rawRepoName: string = repoNameSegments[repoNameSegments.length - 1] || 'target-repo';
  const repoName: string = rawRepoName.replace(GIT_EXTENSION_PATTERN, '') || 'target-repo';

  const script: string = `#!/usr/bin/env bash
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