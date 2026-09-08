export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type Confidence = 'High' | 'Medium' | 'Low';

export type SecretCategory =
  | 'Cloud Keys'
  | 'AI & LLM Keys'
  | 'Payment & Finance'
  | 'Communication & Social'
  | 'Database & Storage'
  | 'Authentication & Tokens'
  | 'Private Keys'
  | 'PII & Financial Data';

export type FileScanStatus = 'scanned' | 'skipped_binary' | 'skipped_large' | 'skipped_ignored';

export type ChatRole = 'user' | 'assistant';

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