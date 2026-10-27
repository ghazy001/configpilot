/** Public file labels and one-based physical line numbers. Never includes values. */
export interface SourceLocation {
  file: string;
  line: number;
}

export interface Declaration {
  key: string;
  location: SourceLocation;
}

export declare const ISSUE_CODES: Readonly<{
  INVALID_DECLARATION: "INVALID_DECLARATION";
  UNSUPPORTED_MULTILINE: "UNSUPPORTED_MULTILINE";
  DUPLICATE_KEY: "DUPLICATE_KEY";
  MISSING_KEY: "MISSING_KEY";
  UNDOCUMENTED_KEY: "UNDOCUMENTED_KEY";
  COMPARISON_SKIPPED: "COMPARISON_SKIPPED";
}>;

export type IssueCode = (typeof ISSUE_CODES)[keyof typeof ISSUE_CODES];
export type Severity = "error" | "warning" | "info";
export type InputSource = "template" | "environment";

interface IssueText {
  message: string;
  recommendation: string;
}

export interface SyntaxIssue extends IssueText {
  code: "INVALID_DECLARATION" | "UNSUPPORTED_MULTILINE";
  severity: "error";
  location: SourceLocation;
}

export interface DuplicateKeyIssue extends IssueText {
  code: "DUPLICATE_KEY";
  severity: "warning";
  key: string;
  location: SourceLocation;
  relatedLocation: SourceLocation;
}

export type ParserIssue = SyntaxIssue | DuplicateKeyIssue;

export interface ParseOptions {
  /** Nonempty public label; defaults to "<input>". No filesystem access. */
  file?: string | undefined;
}

export interface ParseResult {
  /** All accepted occurrences, including duplicates, in source order. */
  declarations: Declaration[];
  issues: ParserIssue[];
}

/**
 * Parse the documented dotenv subset, retaining no assignment values.
 * @throws {TypeError} For invalid inputs or labels.
 * @throws {RangeError} Above source, declaration or public-metadata budgets (see parser contract).
 */
export declare function parseDotenv(
  source: string,
  options?: ParseOptions,
): ParseResult;

export interface AnalyzeConfigInput {
  template: string;
  environment: string;
  /** Nonempty public label; defaults to ".env.example". */
  templateFile?: string | undefined;
  /** Nonempty public label; defaults to ".env". */
  environmentFile?: string | undefined;
}

export interface MissingKeyIssue extends IssueText {
  code: "MISSING_KEY";
  severity: "warning";
  source: "template";
  key: string;
  location: SourceLocation;
}

export interface UndocumentedKeyIssue extends IssueText {
  code: "UNDOCUMENTED_KEY";
  severity: "warning";
  source: "environment";
  key: string;
  location: SourceLocation;
}

export interface ComparisonSkippedIssue extends IssueText {
  code: "COMPARISON_SKIPPED";
  severity: "info";
  source: "comparison";
}

export type LocatedSyntaxIssue = SyntaxIssue & { source: InputSource };
export type LocatedDuplicateKeyIssue = DuplicateKeyIssue & {
  source: InputSource;
};
export type CompleteIssue =
  LocatedDuplicateKeyIssue | MissingKeyIssue | UndocumentedKeyIssue;
export type SkippedIssue =
  LocatedSyntaxIssue | LocatedDuplicateKeyIssue | ComparisonSkippedIssue;
export type AnalysisIssue = CompleteIssue | SkippedIssue;

interface SummaryCounts {
  errors: number;
  warnings: number;
  info: number;
  total: number;
  templateKeys: number;
  environmentKeys: number;
}

export interface CompleteSummary extends SummaryCounts {
  sharedKeys: number;
  missingKeys: number;
  undocumentedKeys: number;
}

export interface SkippedSummary extends SummaryCounts {
  sharedKeys: null;
  missingKeys: null;
  undocumentedKeys: null;
}

export interface CompleteReport {
  schemaVersion: 1;
  comparison: "complete";
  issues: CompleteIssue[];
  summary: CompleteSummary;
}

export interface SkippedReport {
  schemaVersion: 1;
  comparison: "skipped";
  issues: SkippedIssue[];
  summary: SkippedSummary;
}

export type AnalysisReport = CompleteReport | SkippedReport;

/**
 * Compare explicit dotenv strings synchronously, without I/O or retained values.
 * Syntax errors skip all differences. See the versioned report contract.
 * @throws {TypeError} For invalid inputs or labels.
 * @throws {RangeError} If either input exceeds source, declaration or public-metadata budgets.
 */
export declare function analyzeConfig(
  input: AnalyzeConfigInput,
): AnalysisReport;

/** Discovery has a separate schema; it does not alter AnalysisReport. */
export interface EnvironmentReference {
  name: string;
  location: SourceLocation;
  syntax: "process.env" | "import.meta.env";
  notation: "dot" | "bracket" | "destructuring";
  hasStaticFallback: boolean;
}
export interface DiscoveryIssue {
  code:
    | "SOURCE_DYNAMIC_REFERENCE"
    | "SOURCE_PARSE_ERROR"
    | "SOURCE_SKIPPED"
    | "SOURCE_SYMLINK_SKIPPED"
    | "SOURCE_CONFIG_INVALID"
    | "SOURCE_UNDOCUMENTED_KEY"
    | "SOURCE_MISSING_LOCAL_KEY"
    | "SOURCE_OPTIONAL_REFERENCE"
    | "SOURCE_POTENTIAL_SECRET"
    | "REQUIRED_KEY"
    | "EMPTY_REQUIRED_KEY";
  severity: "info" | "warning" | "error";
  message: string;
  location?: SourceLocation;
  name?: string;
  recommendation?: string;
}
export interface DiscoveredVariable {
  name: string;
  category: string;
  purpose: string;
  confidence: "low" | "medium";
  potentiallySensitive: boolean;
  frameworkProvided: boolean;
  referenceCount: number;
  references: EnvironmentReference[];
  hasStaticFallback: boolean;
  potentiallyRequired: boolean;
  inTemplate: boolean | null;
  inEnvironment: boolean | null;
  configurationRole?: "optional" | "external" | "required" | "unspecified";
}
export interface DiscoveryReport {
  schemaVersion: 1;
  kind: "discovery";
  complete: boolean;
  filesScanned: number;
  bytesScanned: number;
  variables: DiscoveredVariable[];
  issues: DiscoveryIssue[];
  policy?: { failOn: "warning" | "error" | "never"; failed: boolean };
  configuration: {
    detected: string[];
    template: string | null;
    environment: string | null;
  };
}
/** Pure bounded AST extraction; malformed code returns a sanitized issue. */
export declare function scanSource(
  source: string,
  options?: { file?: string },
): { references: EnvironmentReference[]; issues: DiscoveryIssue[] };
/** Read-only filesystem discovery; safe errors expose only a stable code. */
export declare function scanProject(options?: {
  root?: string;
  path?: string;
  template?: string;
  environment?: string;
  rules?: ProjectRules;
}): Promise<DiscoveryReport>;
/** Pure generation. Requires complete discovery; never copies source defaults. */
export declare function generateEnvTemplate(
  report: DiscoveryReport,
  options?: { additionalKeys?: string[] },
): string;
/** Explicit authorized creation only; never overwrites. May leave a partial new file on I/O failure. */
export declare function createEnvFile(options: {
  root?: string;
  output?: string;
  content: string;
  confirmed: true;
}): Promise<{ created: true; output: string }>;

/** Explicit local policy only. Never reads process.env or executes configuration. */
export interface ProjectRules {
  optionalKeys?: string[];
  externalKeys?: string[];
  requiredKeys?: string[];
  /** Slash-separated paths with * within segments and ** as a whole segment. */
  ignore?: string[];
  severity?: Partial<Record<PolicyCode, Severity | "off">>;
  failOn?: "warning" | "error" | "never";
}
export type PolicyCode =
  | "MISSING_KEY"
  | "UNDOCUMENTED_KEY"
  | "DUPLICATE_KEY"
  | "SOURCE_UNDOCUMENTED_KEY"
  | "SOURCE_MISSING_LOCAL_KEY"
  | "SOURCE_DYNAMIC_REFERENCE"
  | "SOURCE_OPTIONAL_REFERENCE"
  | "SOURCE_POTENTIAL_SECRET"
  | "REQUIRED_KEY"
  | "EMPTY_REQUIRED_KEY";
export interface PolicyIssue {
  code: IssueCode | PolicyCode;
  severity: Severity;
  source: InputSource | "comparison";
  key?: string;
  location?: SourceLocation;
  relatedLocation?: SourceLocation;
  message: string;
  recommendation: string;
}
export interface PolicyCheckReport {
  schemaVersion: 1;
  kind: "policy-check";
  /** Original unmodified check contract, before project rules. */
  analysis: AnalysisReport;
  issues: PolicyIssue[];
  summary: { errors: number; warnings: number; info: number; total: number };
  failed: boolean;
}
export declare function analyzeConfigWithRules(
  input: AnalyzeConfigInput,
  rules?: ProjectRules,
): PolicyCheckReport;
export interface TemplateUpdateReport {
  schemaVersion: 1;
  kind: "template-diff";
  template: string | null;
  keys: string[];
  /** Safe empty assignments only. No existing lines or source defaults. */
  content: string;
}
export declare function previewTemplateUpdates(
  report: DiscoveryReport,
  options?: { requiredKeys?: string[]; templateKeys?: string[] },
): TemplateUpdateReport;
