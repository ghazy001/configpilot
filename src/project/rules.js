const NAME = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;
const LEVELS = ["off", "info", "warning", "error"];
export const POLICY_CODES = Object.freeze([
  "MISSING_KEY",
  "UNDOCUMENTED_KEY",
  "DUPLICATE_KEY",
  "SOURCE_UNDOCUMENTED_KEY",
  "SOURCE_MISSING_LOCAL_KEY",
  "SOURCE_DYNAMIC_REFERENCE",
  "SOURCE_OPTIONAL_REFERENCE",
  "SOURCE_POTENTIAL_SECRET",
  "REQUIRED_KEY",
  "EMPTY_REQUIRED_KEY",
]);
export function projectError(code = "PROJECT_CONFIG_INVALID") {
  return Object.assign(new Error(code), { code });
}
export function object(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !Object.keys(value).every((key) => keys.includes(key))
  )
    throw projectError();
}
export function safeRelative(value, allowDot = true) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 512 &&
    !/[\p{Cc}\p{Cf}\\:]/u.test(value) &&
    !value.startsWith("/") &&
    !value.split("/").some((p) => !p || p === "..") &&
    (allowDot || value !== ".")
  );
}
export function normalizeRules(value = {}) {
  object(value, [
    "optionalKeys",
    "externalKeys",
    "requiredKeys",
    "ignore",
    "severity",
    "failOn",
  ]);
  const result = {};
  for (const field of [
    "optionalKeys",
    "externalKeys",
    "requiredKeys",
    "ignore",
  ]) {
    const list = value[field] === undefined ? [] : value[field];
    if (
      !Array.isArray(list) ||
      list.length > (field === "ignore" ? 32 : 256) ||
      list.some((v) =>
        field === "ignore"
          ? !safeRelative(v, false) || v.length > 128
          : typeof v !== "string" || !NAME.test(v),
      )
    )
      throw projectError();
    const normalized =
      field === "ignore"
        ? list.map((v) =>
            v
              .split("/")
              .filter((p) => p !== ".")
              .join("/"),
          )
        : list;
    if (field === "ignore" && normalized.some((v) => !v || v.startsWith("!")))
      throw projectError();
    result[field] = [...new Set(normalized)].sort();
  }
  const all = [
    ...result.optionalKeys,
    ...result.externalKeys,
    ...result.requiredKeys,
  ];
  if (new Set(all).size !== all.length) throw projectError();
  result.severity = value.severity === undefined ? {} : value.severity;
  object(result.severity, POLICY_CODES);
  if (Object.values(result.severity).some((v) => !LEVELS.includes(v)))
    throw projectError();
  result.severity = { ...result.severity };
  result.failOn = value.failOn === undefined ? "warning" : value.failOn;
  if (!["warning", "error", "never"].includes(result.failOn))
    throw projectError();
  return result;
}
export function counts(issues) {
  return {
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
    total: issues.length,
  };
}
export function policyFailed(issues, rules) {
  return (
    issues.some(
      (i) => i.severity === "error" && !POLICY_CODES.includes(i.code),
    ) ||
    (rules.failOn !== "never" &&
      issues.some(
        (i) =>
          i.severity === "error" ||
          (rules.failOn === "warning" && i.severity === "warning"),
      ))
  );
}
export function applyIssues(issues, rules) {
  const declaredElsewhere = new Set([
    ...rules.externalKeys,
    ...rules.optionalKeys,
  ]);
  const rank = { error: 0, warning: 1, info: 2 };
  return issues
    .flatMap((issue) => {
      const key = issue.key ?? issue.name;
      if (
        ["MISSING_KEY", "SOURCE_MISSING_LOCAL_KEY"].includes(issue.code) &&
        declaredElsewhere.has(key)
      )
        return [
          {
            ...issue,
            severity: "info",
            message: rules.externalKeys.includes(key)
              ? "Project rules declare this key externally supplied; external provisioning was not inspected."
              : "Project rules declare this local key optional.",
          },
        ];
      const severity = rules.severity[issue.code] ?? issue.severity;
      return severity === "off" ? [] : [{ ...issue, severity }];
    })
    .sort((a, b) => rank[a.severity] - rank[b.severity]);
}
export function requiredIssues(states, rules, file, nameField = "key") {
  if (states === undefined) return [];
  return rules.requiredKeys.flatMap((key) => {
    const state = states?.get(key);
    if (state && !state.empty) return [];
    return [
      {
        code: state ? "EMPTY_REQUIRED_KEY" : "REQUIRED_KEY",
        severity: "error",
        [nameField]: key,
        ...(state ? { location: state.location } : {}),
        message: state
          ? "This explicitly required local key has a blank value."
          : "This explicitly required local key has no local declaration.",
        recommendation:
          "Supply this key privately in the selected local file, or review the project rule. No value is reported.",
        ...(file ? { source: "environment" } : {}),
      },
    ];
  });
}

// Only * within a segment and ** as a whole segment are special. No regex
// compilation or recursive backtracking of untrusted patterns.
function segmentMatches(pattern, text) {
  const parts = pattern.split("*");
  if (parts.length === 1) return pattern === text;
  if (!text.startsWith(parts[0]) || !text.endsWith(parts.at(-1))) return false;
  let at = parts[0].length;
  const end = text.length - parts.at(-1).length;
  for (const part of parts.slice(1, -1)) {
    at = text.indexOf(part, at);
    if (at < 0 || at + part.length > end) return false;
    at += part.length;
  }
  return at <= end;
}
export function isIgnored(path, patterns) {
  const segments = path.split("/");
  return patterns.some((pattern) => {
    const pieces = pattern.split("/");
    let states = new Set([0]);
    const advance = () => {
      for (let i = 0; i < pieces.length; i++)
        if (states.has(i) && pieces[i] === "**") states.add(i + 1);
    };
    advance();
    for (const segment of segments) {
      const next = new Set();
      for (const i of states) {
        if (pieces[i] === "**") next.add(i);
        else if (pieces[i] !== undefined && segmentMatches(pieces[i], segment))
          next.add(i + 1);
      }
      states = next;
      advance();
    }
    return states.has(pieces.length);
  });
}
