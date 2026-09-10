export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export type Severity = typeof SEVERITIES[number];

export const CONFIDENCES = ['High', 'Medium', 'Low'] as const;
export type Confidence = typeof CONFIDENCES[number];

export const SECRET_CATEGORIES = [
  'Cloud Keys',
  'AI & LLM Keys',
  'Payment & Finance',
  'Communication & Social',
  'Database & Storage',
  'Authentication & Tokens',
  'Private Keys',
  'PII & Financial Data',
] as const;
export type SecretCategory = typeof SECRET_CATEGORIES[number];

export const FILE_SCAN_STATUSES = [
  'scanned',
  'skipped_binary',
  'skipped_large',
  'skipped_ignored',
] as const;
export type FileScanStatus = typeof FILE_SCAN_STATUSES[number];

export const CHAT_ROLES = ['user', 'assistant'] as const;
export type ChatRole = typeof CHAT_ROLES[number];

export interface SecretPattern {
  readonly id: string;
  readonly name: string;
  readonly category: SecretCategory;
  readonly regex: RegExp;
  readonly placeholder: string;
  readonly defaultConfidence: Confidence;
  readonly severity: Severity;
  readonly description?: string;
}

export interface Finding {
  readonly id: string;
  readonly repo?: string;
  readonly filePath: string;
  readonly lineNumber: number;
  readonly patternId: string;
  readonly patternName: string;
  readonly category: SecretCategory | string;
  readonly matchedText: string;
  readonly redactedText: string;
  readonly contextSnippet: string;
  readonly confidence: Confidence;
  readonly severity: Severity;
  readonly timestamp: string;
}

export interface FileScanResult {
  readonly filePath: string;
  readonly fileSize: number;
  readonly status: FileScanStatus;
  readonly findingsCount: number;
}

export interface SkipBreakdown {
  readonly binary: number;
  readonly tooLarge: number;
  readonly ignored: number;
}

export interface ScanStats {
  readonly filesScanned: number;
  readonly filesSkipped: number;
  readonly skipReasons: SkipBreakdown;
  readonly totalFindings: number;
  readonly durationSeconds: number;
  readonly findingsBySeverity: Readonly<Record<Severity, number>>;
  readonly findingsByCategory: Readonly<Record<string, number>>;
}

export interface RepoBranch {
  readonly name: string;
  readonly protected: boolean;
  readonly sha: string;
}

export interface GitHubRepoInfo {
  readonly owner: string;
  readonly name: string;
  readonly defaultBranch: string;
  readonly branches: readonly RepoBranch[];
  readonly isPrivate: boolean;
}

export interface AiAnalysisResult {
  readonly threatLevel: Severity;
  readonly summary: string;
  readonly blastRadius: string;
  readonly complianceImpact: readonly string[];
  readonly remediationSteps: readonly string[];
  readonly suggestedPatch: string;
  readonly evolutionRecommendations: readonly string[];
  readonly thinkingProcess?: string;
}

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly timestamp: string;
}

/**
 * Runtime Type Guard Utilities with optimized performance lookup structures.
 */
const SEVERITY_SET: ReadonlySet<string> = new Set(SEVERITIES);
const CONFIDENCE_SET: ReadonlySet<string> = new Set(CONFIDENCES);
const SECRET_CATEGORY_SET: ReadonlySet<string> = new Set(SECRET_CATEGORIES);
const FILE_SCAN_STATUS_SET: ReadonlySet<string> = new Set(FILE_SCAN_STATUSES);
const CHAT_ROLE_SET: ReadonlySet<string> = new Set(CHAT_ROLES);

export function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && SEVERITY_SET.has(value);
}

export function isConfidence(value: unknown): value is Confidence {
  return typeof value === 'string' && CONFIDENCE_SET.has(value);
}

export function isSecretCategory(value: unknown): value is SecretCategory {
  return typeof value === 'string' && SECRET_CATEGORY_SET.has(value);
}

export function isFileScanStatus(value: unknown): value is FileScanStatus {
  return typeof value === 'string' && FILE_SCAN_STATUS_SET.has(value);
}

export function isChatRole(value: unknown): value is ChatRole {
  return typeof value === 'string' && CHAT_ROLE_SET.has(value);
}

export function isFinding(value: unknown): value is Finding {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    (v.repo === undefined || typeof v.repo === 'string') &&
    typeof v.filePath === 'string' &&
    typeof v.lineNumber === 'number' &&
    typeof v.patternId === 'string' &&
    typeof v.patternName === 'string' &&
    (typeof v.category === 'string') &&
    typeof v.matchedText === 'string' &&
    typeof v.redactedText === 'string' &&
    typeof v.contextSnippet === 'string' &&
    isConfidence(v.confidence) &&
    isSeverity(v.severity) &&
    typeof v.timestamp === 'string'
  );
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    isChatRole(v.role) &&
    typeof v.content === 'string' &&
    typeof v.timestamp === 'string'
  );
}