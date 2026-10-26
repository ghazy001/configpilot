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
 * @throws {RangeError} Above 1,048,576 UTF-16 code units.
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
 * @throws {RangeError} If either input exceeds the parser limit.
 */
export declare function analyzeConfig(
  input: AnalyzeConfigInput,
): AnalysisReport;
