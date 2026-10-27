import { writer, terminalHeader } from "./terminal.js";
import { counts } from "../project/rules.js";

export function formatTemplateUpdates(report, options = {}) {
  const t = writer(options);
  terminalHeader(t, "SCAN", "Template additions preview", options);
  t.row(
    report.keys.length
      ? "Template additions ready"
      : "No template additions needed",
    "READ ONLY",
    "key",
    "info",
  );
  t.line();
  t.detail(
    "Template",
    report.template ? JSON.stringify(report.template) : "No template selected",
    "path",
  );
  t.line(`${report.keys.length} suggested additions`, "key");
  t.line();
  for (const key of report.keys) t.line(`${key}=`, "key");
  t.line();
  t.panel({
    body: "Review and copy these empty assignments manually. No existing values were copied. No files were modified.",
    commands: ["configpilot check --help"],
  });
  return t.result();
}
export function formatWorkspaces(report, options = {}) {
  const t = writer(options);
  terminalHeader(t, "WORKSPACES", "Independent configuration reports", options);
  const all = report.workspaces.flatMap((w) =>
    w.report.error ? [{ severity: "error" }] : (w.report.issues ?? []),
  );
  t.metrics(counts(all));
  t.line();
  for (const w of report.workspaces) {
    t.row(
      w.name,
      w.exitCode === 2 ? "FAILED" : w.exitCode === 1 ? "REVIEW" : "PASSED",
      "key",
      w.exitCode === 2 ? "error" : w.exitCode === 1 ? "warning" : "success",
    );
    t.detail("Root", JSON.stringify(w.root), "path");
    if (w.report.error) t.detail("Finding", w.report.error.code, "error");
    if (w.report.kind === "discovery")
      t.detail(
        "Scan",
        `${w.report.filesScanned} files / ${w.report.variables.length} variables`,
      );
    const rank = { error: 0, warning: 1, info: 2 };
    const ordered = [...(w.report.issues ?? [])].sort(
      (a, b) => rank[a.severity] - rank[b.severity],
    );
    for (const issue of ordered.slice(0, options.verbose ? undefined : 20)) {
      t.detail(
        "Finding",
        `${issue.code}${issue.key || issue.name ? " — " + (issue.key ?? issue.name) : ""}`,
        issue.severity,
      );
      t.detail("Message", issue.message);
      if (issue.recommendation) t.detail("Action", issue.recommendation);
      const location =
        issue.location ??
        w.report.variables?.find((v) => v.name === issue.name)?.references[0]
          ?.location;
      if (location)
        t.detail(
          "Location",
          `${JSON.stringify(location.file)}:${location.line}`,
          "path",
        );
    }
    if (!options.verbose && (w.report.issues?.length ?? 0) > 20)
      t.line("More findings are available with --json.", "muted");
    if (w.report.kind === "template-diff")
      for (const key of w.report.keys) t.line(`${key}=`);
    t.line();
  }
  t.panel({
    body: "Each root uses its own source and selected configuration. Value validity and deployment provisioning were not checked. No workspace files were modified.",
    commands: ["configpilot scan --help", "configpilot check --help"],
  });
  return t.result();
}
