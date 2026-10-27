import { analyzeConfig } from "../analyzer/config-analyzer.js";
import { inspectDeclarations } from "../parser/dotenv-parser.js";
import {
  normalizeRules,
  applyIssues,
  counts,
  policyFailed,
  requiredIssues,
} from "./rules.js";

/** Opt-in pure policy evaluation; original analysis and its schema stay intact. */
export function analyzeConfigWithRules(input, rules = {}) {
  const normalized = normalizeRules(rules);
  const analysis = analyzeConfig(input);
  const states =
    analysis.comparison === "complete"
      ? inspectDeclarations(input.environment, {
          file: input.environmentFile ?? ".env",
        }).states
      : undefined;
  const issues = applyIssues(
    [...analysis.issues, ...requiredIssues(states, normalized, true)],
    normalized,
  );
  return {
    schemaVersion: 1,
    kind: "policy-check",
    analysis,
    issues,
    summary: counts(issues),
    failed: policyFailed(issues, normalized),
  };
}
