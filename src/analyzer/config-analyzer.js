import { parseDotenv } from "../parser/dotenv-parser.js";
import { createIssue, ISSUE_CODES } from "../diagnostics/issue-codes.js";

function firstDeclarations(declarations) {
  const result = new Map();
  for (const { key, location } of declarations) {
    if (!result.has(key)) result.set(key, location);
  }
  return result;
}

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };
const SOURCE_ORDER = { template: 0, environment: 1, comparison: 2 };

// Source and line order have no locale, filesystem, or platform dependencies.
function compareIssues(left, right) {
  return (
    SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
    SOURCE_ORDER[left.source] - SOURCE_ORDER[right.source] ||
    (left.location?.line ?? 0) - (right.location?.line ?? 0)
  );
}

/**
 * Compare two explicit dotenv strings, without filesystem or environment access.
 * @param {{template: string, environment: string, templateFile?: string, environmentFile?: string}} input
 * @returns {{schemaVersion: number, comparison: string, issues: Array<object>, summary: object}}
 * @throws {TypeError} For invalid inputs, without echoing their contents.
 * @throws {RangeError} If either string exceeds the parser's size limit.
 */
export function analyzeConfig(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(
      "analyzeConfig requires an object with template and environment strings.",
    );
  }
  const {
    template,
    environment,
    templateFile = ".env.example",
    environmentFile = ".env",
  } = input;
  for (const [name, value] of [
    ["template", template],
    ["environment", environment],
  ]) {
    if (typeof value !== "string") {
      throw new TypeError(`${name} must be a string.`);
    }
  }
  for (const [name, value] of [
    ["templateFile", templateFile],
    ["environmentFile", environmentFile],
  ]) {
    if (typeof value !== "string" || value.length === 0) {
      throw new TypeError(`${name} must be a non-empty string.`);
    }
  }

  const parsedTemplate = parseDotenv(template, { file: templateFile });
  const parsedEnvironment = parseDotenv(environment, { file: environmentFile });
  const templateKeys = firstDeclarations(parsedTemplate.declarations);
  const environmentKeys = firstDeclarations(parsedEnvironment.declarations);
  const issues = [
    ...parsedTemplate.issues.map((finding) => ({
      ...finding,
      source: "template",
    })),
    ...parsedEnvironment.issues.map((finding) => ({
      ...finding,
      source: "environment",
    })),
  ];
  const skipped = issues.some(({ severity }) => severity === "error");
  let missingKeys = null;
  let undocumentedKeys = null;
  let sharedKeys = null;

  if (skipped) {
    issues.push({
      ...createIssue(ISSUE_CODES.COMPARISON_SKIPPED),
      source: "comparison",
    });
  } else {
    missingKeys = 0;
    undocumentedKeys = 0;
    sharedKeys = 0;
    for (const [key, location] of templateKeys) {
      if (environmentKeys.has(key)) {
        sharedKeys += 1;
      } else {
        missingKeys += 1;
        issues.push({
          ...createIssue(ISSUE_CODES.MISSING_KEY, location),
          source: "template",
          key,
        });
      }
    }
    for (const [key, location] of environmentKeys) {
      if (!templateKeys.has(key)) {
        undocumentedKeys += 1;
        issues.push({
          ...createIssue(ISSUE_CODES.UNDOCUMENTED_KEY, location),
          source: "environment",
          key,
        });
      }
    }
  }

  issues.sort(compareIssues);
  return {
    schemaVersion: 1,
    comparison: skipped ? "skipped" : "complete",
    issues,
    summary: {
      errors: issues.filter(({ severity }) => severity === "error").length,
      warnings: issues.filter(({ severity }) => severity === "warning").length,
      info: issues.filter(({ severity }) => severity === "info").length,
      total: issues.length,
      templateKeys: templateKeys.size,
      environmentKeys: environmentKeys.size,
      sharedKeys,
      missingKeys,
      undocumentedKeys,
    },
  };
}
