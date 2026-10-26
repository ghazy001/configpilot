import { analyzeConfig, parseDotenv, ISSUE_CODES } from "configpilot";

// These assertions must fail compilation if the declarations lose safety.
// @ts-expect-error Required inputs cannot be omitted.
analyzeConfig({ template: "" });
// @ts-expect-error Sources must be primitive strings.
parseDotenv(42);
// @ts-expect-error Labels must be strings.
parseDotenv("", { file: 42 });
// @ts-expect-error The runtime catalog is frozen.
ISSUE_CODES.MISSING_KEY = "MISSING_KEY";
import * as configpilot from "configpilot";
// @ts-expect-error No default export is part of the API, including with synthetic-default compiler settings.
configpilot.default;
// @ts-expect-error Internal paths are not public exports.
import { createIssue } from "configpilot/src/diagnostics/issue-codes.js";

const parsed = parseDotenv("");
// @ts-expect-error Assignment values are never retained.
parsed.declarations[0].value;
for (const issue of parsed.issues) {
  // @ts-expect-error Parser findings have no analyzer source role.
  issue.source;
  if (issue.code !== "DUPLICATE_KEY") {
    // @ts-expect-error Syntax findings deliberately omit keys.
    issue.key;
  }
}

const report = analyzeConfig({ template: "", environment: "" });
// @ts-expect-error Versioned reports have literal schema version 1.
const wrongVersion: 2 = report.schemaVersion;
// @ts-expect-error Counts can be null until comparison is narrowed.
const count: number = report.summary.missingKeys;
if (report.comparison === "skipped") {
  // @ts-expect-error Skipped differences are unavailable, never zero.
  const missing: number = report.summary.missingKeys;
  for (const issue of report.issues) {
    if (issue.code === "COMPARISON_SKIPPED") {
      // @ts-expect-error Comparison-level findings have no location.
      issue.location;
      // @ts-expect-error Comparison-level findings have no key.
      issue.key;
    }
  }
} else {
  // @ts-expect-error Complete comparisons always have numeric counts.
  const missing: null = report.summary.missingKeys;
  for (const issue of report.issues) {
    if (issue.code === "MISSING_KEY") {
      // @ts-expect-error Missing keys refer to the template.
      const source: "environment" = issue.source;
      // @ts-expect-error Missing declarations are warnings.
      const severity: "error" = issue.severity;
    }
  }
}
