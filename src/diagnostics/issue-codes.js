/** Stable codes shared by the parser and analyzer. */
export const ISSUE_CODES = Object.freeze({
  INVALID_DECLARATION: "INVALID_DECLARATION",
  UNSUPPORTED_MULTILINE: "UNSUPPORTED_MULTILINE",
  DUPLICATE_KEY: "DUPLICATE_KEY",
  MISSING_KEY: "MISSING_KEY",
  UNDOCUMENTED_KEY: "UNDOCUMENTED_KEY",
  COMPARISON_SKIPPED: "COMPARISON_SKIPPED",
});

const DETAILS = {
  INVALID_DECLARATION: {
    severity: "error",
    message: "Declaration does not match the supported dotenv syntax.",
    recommendation:
      "Use NAME=value with a portable variable name and complete single-line quotes. Check the documented parser syntax.",
  },
  UNSUPPORTED_MULTILINE: {
    severity: "error",
    message: "Quoted multiline values are not supported.",
    recommendation:
      "Use a single-line value with escaped line breaks, or exclude this file until multiline parsing is supported.",
  },
  DUPLICATE_KEY: {
    severity: "warning",
    message: "Variable is declared more than once in this input.",
    recommendation:
      "Keep one declaration for this variable to avoid loader-dependent overrides.",
  },
  MISSING_KEY: {
    severity: "warning",
    message:
      "Template variable has no declaration in the environment input. It may be supplied externally.",
    recommendation:
      "Provide this key locally or through the deployment environment. Verify external provisioning before changing files.",
  },
  UNDOCUMENTED_KEY: {
    severity: "warning",
    message:
      "Environment variable is not documented in the reference template.",
    recommendation:
      "Document this key in the reference template if intentional, or review whether it is still needed.",
  },
  COMPARISON_SKIPPED: {
    severity: "info",
    message:
      "Key comparison was skipped because at least one input could not be parsed completely.",
    recommendation:
      "Resolve syntax errors and unsupported constructs in both inputs, then run the comparison again.",
  },
};

// Internal factory. Locations and key names come only from parsed declarations;
// diagnostic text never interpolates user input or configuration values.
export function createIssue(code, location) {
  const result = { code, ...DETAILS[code] };
  if (location !== undefined) result.location = location;
  return result;
}
