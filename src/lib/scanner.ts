import { Finding, SecretPattern, Severity, Confidence, ScanStats, SkipBreakdown } from '../types';

/**
 * Validates a credit card number using the Luhn Algorithm.
 * Returns true if valid Luhn checksum, eliminating false positive digit streams.
 */
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Calculates Shannon Entropy of a string (bits per character).
 */
export function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export const SENSITIVE_PATTERNS: SecretPattern[] = [
  // AI & LLM Keys
  {
    id: 'openai-key',
    name: 'OpenAI API Key / Project Token',
    category: 'AI & LLM Keys',
    regex: /\b(sk-[a-zA-Z0-9]{32,}|sk-proj-[a-zA-Z0-9_-]{20,}|sk-admin-[a-zA-Z0-9_-]{20,})\b/g,
    placeholder: '<OPENAI_API_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed OpenAI secret key or project token',
  },
  {
    id: 'anthropic-key',
    name: 'Anthropic Claude API Key',
    category: 'AI & LLM Keys',
    regex: /\b(sk-ant-api03-[a-zA-Z0-9_-]{80,})\b/g,
    placeholder: '<ANTHROPIC_API_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed Anthropic Claude API key',
  },
  {
    id: 'google-gemini-key',
    name: 'Google Gemini / Cloud API Key',
    category: 'AI & LLM Keys',
    regex: /\b(AIzaSy[a-zA-Z0-9_-]{33})\b/g,
    placeholder: '<GEMINI_API_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed Google Gemini or Firebase AI key',
  },
  {
    id: 'cohere-key',
    name: 'Cohere API Key',
    category: 'AI & LLM Keys',
    regex: /\b(co-[a-zA-Z0-9]{38,40})\b/g,
    placeholder: '<COHERE_API_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'High',
    description: 'Exposed Cohere API token',
  },
  {
    id: 'mistral-key',
    name: 'Mistral AI API Key',
    category: 'AI & LLM Keys',
    regex: /\b(mis_[a-zA-Z0-9]{32})\b/g,
    placeholder: '<MISTRAL_API_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'High',
    description: 'Exposed Mistral AI token',
  },

  // GitHub & GitLab Tokens
  {
    id: 'github-pat',
    name: 'GitHub Personal Access Token',
    category: 'Authentication & Tokens',
    regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b/g,
    placeholder: '<GITHUB_PAT_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed GitHub personal access token',
  },
  {
    id: 'github-oauth-user-server',
    name: 'GitHub OAuth / App Token',
    category: 'Authentication & Tokens',
    regex: /\b(gho_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{36})\b/g,
    placeholder: '<GITHUB_OAUTH_TOKEN_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed GitHub OAuth or refresh token',
  },
  {
    id: 'gitlab-token',
    name: 'GitLab Personal Access Token',
    category: 'Authentication & Tokens',
    regex: /\b(glpat-[a-zA-Z0-9_-]{20,})\b/g,
    placeholder: '<GITLAB_TOKEN_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed GitLab access token',
  },

  // Cloud Providers (AWS, GCP, Azure)
  {
    id: 'aws-access-key',
    name: 'AWS Access Key ID',
    category: 'Cloud Keys',
    regex: /\b((?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16})\b/g,
    placeholder: '<AWS_ACCESS_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed Amazon Web Services access key ID',
  },
  {
    id: 'aws-secret-key',
    name: 'AWS Secret Access Key',
    category: 'Cloud Keys',
    regex: /(?<=aws_secret_access_key\s*=\s*['"]?)[a-zA-Z0-9\/+]{40}(?=['"]?)/gi,
    placeholder: '<AWS_SECRET_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed AWS secret access key',
  },
  {
    id: 'azure-storage-key',
    name: 'Azure Storage Account Key / Connection String',
    category: 'Cloud Keys',
    regex: /\b(DefaultEndpointsProtocol=https?;AccountName=[a-zA-Z0-9]+;AccountKey=[a-zA-Z0-9\/+=]{86,};?)\b/g,
    placeholder: '<AZURE_CONNECTION_STRING_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed Azure Storage connection string',
  },
  {
    id: 'gcp-service-account',
    name: 'GCP Service Account Private Key',
    category: 'Cloud Keys',
    regex: /"type"\s*:\s*"service_account"\s*,\s*"project_id"\s*:\s*"[^"]+"/g,
    placeholder: '"type": "service_account", "project_id": "<GCP_PROJECT_REDACTED>"',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed GCP service account JSON credential block',
  },

  // Payment & Finance
  {
    id: 'stripe-secret-key',
    name: 'Stripe Secret / Restricted Key',
    category: 'Payment & Finance',
    regex: /\b(sk_live_[0-9a-zA-Z]{24,32}|rk_live_[0-9a-zA-Z]{24,32})\b/g,
    placeholder: '<STRIPE_SECRET_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed Stripe live production key',
  },
  {
    id: 'stripe-publishable-key',
    name: 'Stripe Publishable Key',
    category: 'Payment & Finance',
    regex: /\b(pk_live_[0-9a-zA-Z]{24,32})\b/g,
    placeholder: '<STRIPE_PUB_KEY_REDACTED>',
    defaultConfidence: 'Medium',
    severity: 'Low',
    description: 'Exposed Stripe publishable key',
  },
  {
    id: 'paypal-client-id',
    name: 'PayPal Secret / Client Key',
    category: 'Payment & Finance',
    regex: /\b(E[A-Za-z0-9_-]{79})\b/g,
    placeholder: '<PAYPAL_SECRET_REDACTED>',
    defaultConfidence: 'Medium',
    severity: 'High',
    description: 'Exposed PayPal live client secret',
  },

  // Communication & Social
  {
    id: 'twilio-account-sid',
    name: 'Twilio Account SID & Auth Token',
    category: 'Communication & Social',
    regex: /\b(AC[a-f0-9]{32})\b/g,
    placeholder: '<TWILIO_SID_REDACTED>',
    defaultConfidence: 'High',
    severity: 'High',
    description: 'Exposed Twilio Account SID',
  },
  {
    id: 'slack-bot-token',
    name: 'Slack Bot / User Token',
    category: 'Communication & Social',
    regex: /\b(xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}|xoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}|xapp-[0-9]-[a-zA-Z0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{64})\b/g,
    placeholder: '<SLACK_TOKEN_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed Slack API token',
  },
  {
    id: 'slack-webhook',
    name: 'Slack Incoming Webhook URL',
    category: 'Communication & Social',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{24}/g,
    placeholder: 'https://hooks.slack.com/services/<SLACK_WEBHOOK_REDACTED>',
    defaultConfidence: 'High',
    severity: 'High',
    description: 'Exposed Slack incoming webhook URL',
  },
  {
    id: 'discord-bot-token',
    name: 'Discord Bot Token',
    category: 'Communication & Social',
    regex: /\b([MNO][a-zA-Z0-9_-]{23,25}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27,38})\b/g,
    placeholder: '<DISCORD_TOKEN_REDACTED>',
    defaultConfidence: 'High',
    severity: 'High',
    description: 'Exposed Discord bot token',
  },
  {
    id: 'notion-integration-secret',
    name: 'Notion Integration Secret',
    category: 'Communication & Social',
    regex: /\b(secret_[a-zA-Z0-9]{43})\b/g,
    placeholder: '<NOTION_SECRET_REDACTED>',
    defaultConfidence: 'High',
    severity: 'High',
    description: 'Exposed Notion API integration secret',
  },
  {
    id: 'shopify-token',
    name: 'Shopify Admin / Access Token',
    category: 'Payment & Finance',
    regex: /\b(shpat_[a-fA-F0-9]{32}|shpca_[a-fA-F0-9]{32})\b/g,
    placeholder: '<SHOPIFY_TOKEN_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed Shopify access token',
  },
  {
    id: 'sendgrid-key',
    name: 'SendGrid API Key',
    category: 'Communication & Social',
    regex: /\b(SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43})\b/g,
    placeholder: '<SENDGRID_API_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'High',
    description: 'Exposed SendGrid mail key',
  },
  {
    id: 'mailgun-key',
    name: 'Mailgun API Key',
    category: 'Communication & Social',
    regex: /\b(key-[0-9a-zA-Z]{32})\b/g,
    placeholder: '<MAILGUN_KEY_REDACTED>',
    defaultConfidence: 'High',
    severity: 'High',
    description: 'Exposed Mailgun private key',
  },

  // Databases & URIs
  {
    id: 'mongodb-atlas-uri',
    name: 'MongoDB Connection String with Credentials',
    category: 'Database & Storage',
    regex: /mongodb(\+srv)?:\/\/[a-zA-Z0-9_.-]+:[^@\s"']+@[a-zA-Z0-9_.-]+/g,
    placeholder: 'mongodb+srv://<USER>:<PASSWORD_REDACTED>@<HOST>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed MongoDB connection URI with user/pass',
  },
  {
    id: 'postgres-mysql-redis-uri',
    name: 'PostgreSQL / MySQL / Redis Connection URI',
    category: 'Database & Storage',
    regex: /(postgres|postgresql|mysql|redis):\/\/[a-zA-Z0-9_.-]+:[^@\s"']+@[a-zA-Z0-9_.-]+:\d+/g,
    placeholder: '$1://<USER>:<PASSWORD_REDACTED>@<HOST>:<PORT>',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed relational database or cache connection URI',
  },

  // Keys & JWTs
  {
    id: 'private-pem-rsa-key',
    name: 'PEM / RSA / EC / SSH Private Key Block',
    category: 'Private Keys',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]{30,2000}?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    placeholder: '-----BEGIN PRIVATE KEY-----\n<PRIVATE_KEY_CONTENTS_REDACTED>\n-----END PRIVATE KEY-----',
    defaultConfidence: 'High',
    severity: 'Critical',
    description: 'Exposed cryptographic private key block',
  },
  {
    id: 'jwt-token',
    name: 'JSON Web Token (JWT)',
    category: 'Authentication & Tokens',
    regex: /\b(eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g,
    placeholder: '<JWT_TOKEN_REDACTED>',
    defaultConfidence: 'Medium',
    severity: 'Medium',
    description: 'Exposed JSON Web Token (JWT) bearer string',
  },

  // PII & Identifiers
  {
    id: 'pii-email',
    name: 'Email Address',
    category: 'PII & Financial Data',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    placeholder: '<EMAIL_ADDRESS_REDACTED>',
    defaultConfidence: 'Low',
    severity: 'Low',
    description: 'Personal or employee email address',
  },
  {
    id: 'pii-phone',
    name: 'Phone Number',
    category: 'PII & Financial Data',
    regex: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    placeholder: '<PHONE_NUMBER_REDACTED>',
    defaultConfidence: 'Low',
    severity: 'Low',
    description: 'Phone number in standard international/national format',
  },
  {
    id: 'pii-ipv4-v6',
    name: 'IP Address (IPv4 / IPv6)',
    category: 'PII & Financial Data',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    placeholder: '<IP_ADDRESS_REDACTED>',
    defaultConfidence: 'Low',
    severity: 'Low',
    description: 'IPv4 public or internal IP address',
  },
  {
    id: 'pii-mac-address',
    name: 'MAC Address',
    category: 'PII & Financial Data',
    regex: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g,
    placeholder: '<MAC_ADDRESS_REDACTED>',
    defaultConfidence: 'Low',
    severity: 'Low',
    description: 'Hardware MAC address',
  },
  {
    id: 'pii-iban-swift',
    name: 'IBAN / SWIFT Bank Identifier',
    category: 'PII & Financial Data',
    regex: /\b([A-Z]{2}\d{2}[A-Z0-9]{11,30})\b/g,
    placeholder: '<IBAN_SWIFT_REDACTED>',
    defaultConfidence: 'High',
    severity: 'Medium',
    description: 'International Bank Account Number / SWIFT code',
  }
];

/**
 * Checks if a relative file path should be skipped during scanning.
 */
export function isIgnoredPath(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  const ignoredDirs = [
    'node_modules/', '.git/', 'dist/', 'build/', 'coverage/',
    '.next/', '.output/', 'vendor/', 'tmp/', 'temp/', '.cache/'
  ];
  const ignoredFiles = [
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'composer.lock', 'go.sum', 'Cargo.lock'
  ];

  if (ignoredDirs.some(dir => normalized.includes(dir))) return true;
  if (ignoredFiles.some(file => normalized.endsWith(file))) return true;
  return false;
}

/**
 * Sniffs first 1000 characters for null bytes or typical binary non-text indicators.
 */
export function isBinaryContent(content: string): boolean {
  if (!content) return false;
  const sample = content.slice(0, 1024);
  let nullBytes = 0;
  for (let i = 0; i < sample.length; i++) {
    if (sample.charCodeAt(i) === 0) nullBytes++;
  }
  return nullBytes > 0;
}

/**
 * Scans content for secrets and PII, returning findings and the sanitized content.
 */
export function sanitizeContent(
  content: string,
  filePath: string = 'snippet.txt',
  repoName?: string
): { sanitizedContent: string; findings: Finding[] } {
  const findings: Finding[] = [];
  let sanitizedContent = content;
  const lines = content.split(/\r?\n/);

  // 1. Regex Pattern Matching
  for (const pattern of SENSITIVE_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const matchedText = match[0];

      // Special check for Credit Card Luhn validation
      if (pattern.id === 'pii-credit-card' || /^\d{13,19}$/.test(matchedText.replace(/\D/g, ''))) {
        if (!validateLuhn(matchedText)) {
          continue; // Skip invalid credit card numbers to reduce false positives
        }
      }

      const matchIndex = match.index;
      // Calculate line number
      const preMatchContent = content.slice(0, matchIndex);
      const lineNumber = preMatchContent.split(/\r?\n/).length;

      // Extract surrounding context snippet (~40 chars around match)
      const startCtx = Math.max(0, matchIndex - 20);
      const endCtx = Math.min(content.length, matchIndex + matchedText.length + 20);
      const rawSnippet = content.slice(startCtx, endCtx).replace(/[\r\n]+/g, ' ');
      const contextSnippet = `...${rawSnippet}...`;

      findings.push({
        id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        repo: repoName,
        filePath,
        lineNumber,
        patternId: pattern.id,
        patternName: pattern.name,
        category: pattern.category,
        matchedText,
        redactedText: pattern.placeholder,
        contextSnippet,
        confidence: pattern.defaultConfidence,
        severity: pattern.severity,
        timestamp: new Date().toISOString(),
      });
    }

    // Surgical replacement preserving surrounding quotes / syntax
    sanitizedContent = sanitizedContent.replace(
      new RegExp(pattern.regex.source, pattern.regex.flags),
      pattern.placeholder
    );
  }

  // 2. Shannon Entropy Detector for variable assignments matching secret keywords
  const secretVarRegex = /(?:const|let|var|export|set|define|env|process\.env|ENV)\.?\s*([a-zA-Z0-9_]*key|[a-zA-Z0-9_]*token|[a-zA-Z0-9_]*secret|[a-zA-Z0-9_]*password|[a-zA-Z0-9_]*credential|[a-zA-Z0-9_]*auth)\s*[:=]\s*['"`]([a-zA-Z0-9_\-+/=]{16,128})['"`]/gi;
  
  let entropyMatch: RegExpExecArray | null;
  while ((entropyMatch = secretVarRegex.exec(content)) !== null) {
    const varName = entropyMatch[1];
    const secretCandidate = entropyMatch[2];
    const entropy = calculateEntropy(secretCandidate);

    // If entropy is > 3.8 and not already flagged by regex patterns
    if (entropy > 3.8) {
      const isAlreadyFlagged = findings.some(f => f.matchedText.includes(secretCandidate));
      if (!isAlreadyFlagged) {
        const matchIndex = entropyMatch.index;
        const lineNumber = content.slice(0, matchIndex).split(/\r?\n/).length;
        const contextSnippet = `...${lines[lineNumber - 1] || entropyMatch[0]}...`;

        findings.push({
          id: `entropy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          repo: repoName,
          filePath,
          lineNumber,
          patternId: 'entropy-detector',
          patternName: `High-Entropy Secret (${varName})`,
          category: 'Authentication & Tokens',
          matchedText: secretCandidate,
          redactedText: `<HIGH_ENTROPY_SECRET_REDACTED>`,
          contextSnippet,
          confidence: 'Medium',
          severity: 'High',
          timestamp: new Date().toISOString(),
        });

        // Replace only the candidate string literal value
        sanitizedContent = sanitizedContent.replace(secretCandidate, `<HIGH_ENTROPY_SECRET_REDACTED>`);
      }
    }
  }

  return { sanitizedContent, findings };
}

/**
 * Calculates Scan Stats summary.
 */
export function calculateScanStats(
  scannedCount: number,
  skippedBreakdown: SkipBreakdown,
  findings: Finding[],
  durationSeconds: number
): ScanStats {
  const findingsBySeverity: Record<Severity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  const findingsByCategory: Record<string, number> = {};

  findings.forEach(f => {
    findingsBySeverity[f.severity] = (findingsBySeverity[f.severity] || 0) + 1;
    findingsByCategory[f.category] = (findingsByCategory[f.category] || 0) + 1;
  });

  return {
    filesScanned: scannedCount,
    filesSkipped: skippedBreakdown.binary + skippedBreakdown.tooLarge + skippedBreakdown.ignored,
    skipReasons: skippedBreakdown,
    totalFindings: findings.length,
    durationSeconds: Math.max(0.1, parseFloat(durationSeconds.toFixed(2))),
    findingsBySeverity,
    findingsByCategory,
  };
}

/**
 * Formats findings as SARIF v2.1.0 JSON format for GitHub Security integration.
 */
export function exportToSarif(findings: Finding[]): string {
  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Git Secret & PII Sanitizer',
            informationUri: 'https://github.com/craighckby-stack/AI-Project-Genesis-Scaffold',
            rules: SENSITIVE_PATTERNS.map(p => ({
              id: p.id,
              name: p.name,
              shortDescription: { text: p.description || p.name },
              defaultConfiguration: {
                level: p.severity === 'Critical' || p.severity === 'High' ? 'error' : 'warning',
              },
            })),
          },
        },
        results: findings.map(f => ({
          ruleId: f.patternId,
          message: {
            text: `Exposed ${f.patternName} detected on line ${f.lineNumber}.`,
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: f.filePath,
                },
                region: {
                  startLine: f.lineNumber,
                },
              },
            },
          ],
        })),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

/**
 * Formats findings as CSV string.
 */
export function exportToCsv(findings: Finding[]): string {
  const headers = ['Repo', 'File Path', 'Line Number', 'Pattern Name', 'Category', 'Severity', 'Confidence', 'Matched Text', 'Redacted Text', 'Timestamp'];
  const rows = findings.map(f => [
    `"${f.repo || 'Local'}"`,
    `"${f.filePath}"`,
    f.lineNumber,
    `"${f.patternName}"`,
    `"${f.category}"`,
    `"${f.severity}"`,
    `"${f.confidence}"`,
    `"${f.matchedText.replace(/"/g, '""')}"`,
    `"${f.redactedText.replace(/"/g, '""')}"`,
    `"${f.timestamp}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Formats findings as JSON string.
 */
export function exportToJson(findings: Finding[]): string {
  return JSON.stringify(findings, null, 2);
}
