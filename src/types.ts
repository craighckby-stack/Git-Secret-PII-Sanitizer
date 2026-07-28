export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type Confidence = 'High' | 'Medium' | 'Low';

export interface SecretPattern {
  id: string;
  name: string;
  category: 'Cloud Keys' | 'AI & LLM Keys' | 'Payment & Finance' | 'Communication & Social' | 'Database & Storage' | 'Authentication & Tokens' | 'Private Keys' | 'PII & Financial Data';
  regex: RegExp;
  placeholder: string;
  defaultConfidence: Confidence;
  severity: Severity;
  description?: string;
}

export interface Finding {
  id: string;
  repo?: string;
  filePath: string;
  lineNumber: number;
  patternId: string;
  patternName: string;
  category: string;
  matchedText: string;
  redactedText: string;
  contextSnippet: string;
  confidence: Confidence;
  severity: Severity;
  timestamp: string;
}

export interface FileScanResult {
  filePath: string;
  fileSize: number;
  status: 'scanned' | 'skipped_binary' | 'skipped_large' | 'skipped_ignored';
  findingsCount: number;
}

export interface SkipBreakdown {
  binary: number;
  tooLarge: number;
  ignored: number;
}

export interface ScanStats {
  filesScanned: number;
  filesSkipped: number;
  skipReasons: SkipBreakdown;
  totalFindings: number;
  durationSeconds: number;
  findingsBySeverity: Record<Severity, number>;
  findingsByCategory: Record<string, number>;
}

export interface RepoBranch {
  name: string;
  protected: boolean;
  sha: string;
}

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  defaultBranch: string;
  branches: RepoBranch[];
  isPrivate: boolean;
}

export interface AiAnalysisResult {
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  summary: string;
  blastRadius: string;
  complianceImpact: string[];
  remediationSteps: string[];
  suggestedPatch: string;
  evolutionRecommendations: string[];
  thinkingProcess?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
