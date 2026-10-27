import { posix } from "node:path";
const escape = (value) =>
  String(value)
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(
      /[\p{Cc}\p{Cf}\u2028\u2029]/gu,
      (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
const property = (value) =>
  escape(value).replace(/:/g, "%3A").replace(/,/g, "%2C");
function command(issue, prefix = "", variables = []) {
  const level =
    issue.severity === "error"
      ? "error"
      : issue.severity === "warning"
        ? "warning"
        : "notice";
  const code = /^[A-Z_0-9]{1,64}$/.test(issue.code)
    ? issue.code
    : "CONFIGURATION_FINDING";
  const key = issue.key ?? issue.name;
  const name =
    typeof key === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)
      ? key.slice(0, 128)
      : "";
  const loc =
    issue.location ??
    variables.find((v) => v.name === key)?.references[0]?.location;
  let props = `title=${property("ConfigPilot: " + code)}`;
  if (
    loc &&
    typeof loc.file === "string" &&
    !/^[\\/]|^[A-Za-z]:|[\p{Cc}]/u.test(loc.file) &&
    !loc.file.replace(/\\/g, "/").split("/").includes("..")
  ) {
    const file = posix.normalize(
      posix.join(prefix, loc.file.replace(/\\/g, "/")),
    );
    if (
      file !== ".." &&
      !file.startsWith("../") &&
      !file.startsWith("/") &&
      Number.isInteger(loc.line) &&
      loc.line > 0
    )
      props += `,file=${property(file)},line=${loc.line}`;
  }
  // Fixed code/name only: source snippets, values and arbitrary native text can
  // never enter a workflow command. Review the full JSON for safe explanations.
  return `::${level} ${props}::${escape(code + (name ? " — " + name : ""))}`;
}
export function formatGithub(report) {
  const records =
    report.kind === "workspaces" ? report.workspaces : [{ root: "", report }];
  const buckets = { error: [], warning: [], info: [] };
  for (const record of records) {
    const r = record.report;
    const issues = r.error
      ? [{ code: r.error.code, severity: "error" }]
      : (r.issues ?? []);
    for (const issue of issues)
      (buckets[issue.severity] ?? buckets.info).push({
        issue,
        root: record.root,
        variables: r.variables,
      });
  }
  const ordered = [...buckets.error, ...buckets.warning, ...buckets.info];
  const lines = ordered
    .slice(0, 200)
    .map((r) => command(r.issue, r.root, r.variables));
  const omitted = Math.max(0, ordered.length - 200);
  if (omitted)
    lines.push(
      `::notice title=ConfigPilot::${omitted} additional findings omitted; use --json for the complete report.`,
    );
  if (!lines.length)
    lines.push("::notice title=ConfigPilot::No reportable findings.");
  return lines.join("\n") + "\n";
}
