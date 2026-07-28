import { Finding } from '../types';

/**
 * Generates a production-grade Bash script using git-filter-repo --replace-text
 * to surgically purge exposed secret strings across all Git history.
 */
export function generatePurgeScript(
  repoUrl: string,
  branch: string = 'main',
  findings: Finding[]
): { script: string; replacementsContent: string } {
  // Deduplicate matched text to unique replacement rules
  const replacementRules = new Map<string, string>();

  findings.forEach(f => {
    if (f.matchedText && f.redactedText) {
      // Escape special characters in regex replacement rule for git-filter-repo
      const cleanMatched = f.matchedText.trim();
      if (cleanMatched.length > 3) {
        replacementRules.set(cleanMatched, f.redactedText);
      }
    }
  });

  const replacementsLines: string[] = [];
  replacementRules.forEach((redacted, matched) => {
    // git-filter-repo format: literal==>replacement or regex:pattern==>replacement
    replacementsLines.push(`${matched}==>${redacted}`);
  });

  const replacementsContent = replacementsLines.join('\n');

  const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'target-repo';

  const script = `#!/usr/bin/env bash
# ==============================================================================
# Git Secret & PII Sanitizer — Full Git History Purge Script
# REPO: ${repoUrl}
# BRANCH: ${branch}
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

TEMP_DIR="purge_workspace_${Date.now()}"
echo "📁 Creating isolated mirror clone in \${TEMP_DIR}..."
mkdir -p "\${TEMP_DIR}"
cd "\${TEMP_DIR}"

# 2. Mirror Clone the repository
git clone --mirror "${repoUrl}" "${repoName}.git"
cd "${repoName}.git"

# 3. Create surgical replacements.txt file
cat << 'EOF' > replacements.txt
${replacementsContent}
EOF

echo "📝 Created replacements.txt with ${replacementRules.size} secret pattern rules."

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

  return { script, replacementsContent };
}
