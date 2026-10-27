import {
  analyzeConfig,
  parseDotenv,
  ISSUE_CODES,
  type AnalysisReport,
  type AnalyzeConfigInput,
  type Declaration,
  type IssueCode,
  type ParserIssue,
  type Severity,
} from "configpilot";

const input: AnalyzeConfigInput = {
  template: "TOKEN=example\nPORT=3000",
  environment: "PORT=4000\nEXTRA=synthetic",
  templateFile: undefined,
  environmentFile: undefined,
};
parseDotenv("", { file: undefined });
const report: AnalysisReport = analyzeConfig(input);
if (report.comparison === "complete") {
  const count: number = report.summary.missingKeys;
  if (count !== 1) throw new Error("Unexpected missing key count.");
  for (const issue of report.issues) {
    if (issue.code === ISSUE_CODES.MISSING_KEY) {
      const source: "template" = issue.source;
      if (source !== "template" || issue.key !== "TOKEN") {
        throw new Error("Unexpected missing key diagnostic.");
      }
    }
  }
} else {
  const unavailable: null = report.summary.sharedKeys;
  if (unavailable !== null) throw new Error("Unexpected skipped summary.");
}

const skipped = analyzeConfig({ template: "invalid", environment: "" });
if (skipped.comparison !== "skipped") throw new Error("Expected syntax error.");
for (const issue of skipped.issues) {
  const code: IssueCode = issue.code;
  const severity: Severity = issue.severity;
  if (!code || !severity) throw new Error("Missing diagnostic metadata.");
  if (issue.code === "COMPARISON_SKIPPED") {
    const source: "comparison" = issue.source;
    if (source !== "comparison") throw new Error("Unexpected source.");
  }
}

const parsed = parseDotenv("PORT=3000\nPORT=4000", { file: "public-label" });
const declarations: Declaration[] = parsed.declarations;
const issues: ParserIssue[] = parsed.issues;
if (declarations.length !== 2) throw new Error("Duplicate occurrence lost.");
for (const issue of issues) {
  if (issue.code === "DUPLICATE_KEY" && issue.relatedLocation.line !== 1) {
    throw new Error("Unexpected related location.");
  }
}

import {
  scanSource,
  scanProject,
  generateEnvTemplate,
  createEnvFile,
  type DiscoveryReport,
} from "configpilot";
const extracted = scanSource("process.env.PORT ?? 3000", { file: "app.ts" });
const discovery: DiscoveryReport = {
  schemaVersion: 1,
  kind: "discovery",
  complete: true,
  filesScanned: 0,
  bytesScanned: 0,
  variables: [],
  issues: extracted.issues,
  configuration: { detected: [], template: null, environment: null },
};
const generated: string = generateEnvTemplate(discovery);
const scanner: (options?: { root?: string }) => Promise<DiscoveryReport> =
  scanProject;
const creator: typeof createEnvFile = createEnvFile;
void generated;
void scanner;
void creator;

import {
  analyzeConfigWithRules,
  previewTemplateUpdates,
  type ProjectRules,
  type PolicyCheckReport,
} from "configpilot";
const rules: ProjectRules = {
  requiredKeys: ["TOKEN"],
  severity: { MISSING_KEY: "info" },
  failOn: "error",
};
const policyReport: PolicyCheckReport = analyzeConfigWithRules(
  { template: "TOKEN=", environment: "TOKEN=" },
  rules,
);
if (!policyReport.failed)
  throw new Error("Required placeholder was not checked.");
const updates: string = previewTemplateUpdates(discovery, {
  requiredKeys: ["NEW_KEY"],
}).content;
void updates;
