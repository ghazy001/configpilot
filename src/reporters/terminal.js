import { formatJson } from "./json.js";

function locationText(location, source) {
  return `${source} ${formatJson(location.file).trimEnd()}:${location.line}`;
}

export function formatTerminal(report) {
  const lines = ["ConfigPilot — Configuration Analysis", ""];
  if (report.issues.length === 0)
    lines.push("No configuration issues found.", "");
  for (const issue of report.issues) {
    lines.push(
      `${issue.severity.toUpperCase().padEnd(7)} ${issue.key ? `${issue.key} [${issue.code}]` : issue.code}`,
    );
    if (issue.location)
      lines.push(`        ${locationText(issue.location, issue.source)}`);
    lines.push(
      `        ${issue.message}`,
      `        Action: ${issue.recommendation}`,
    );
    if (issue.relatedLocation)
      lines.push(
        `        First declaration: ${locationText(issue.relatedLocation, issue.source)}`,
      );
    lines.push("");
  }
  const {
    errors,
    warnings,
    info,
    templateKeys,
    environmentKeys,
    sharedKeys,
    missingKeys,
    undocumentedKeys,
  } = report.summary;
  lines.push(
    `Comparison: ${report.comparison}`,
    `Summary: ${errors} ${errors === 1 ? "error" : "errors"}, ${warnings} ${warnings === 1 ? "warning" : "warnings"}, ${info} info.`,
  );
  if (report.comparison === "complete") {
    lines.push(
      `Keys: ${templateKeys} template, ${environmentKeys} environment; ${sharedKeys} shared, ${missingKeys} missing, ${undocumentedKeys} undocumented.`,
    );
  } else {
    lines.push(
      `Keys: ${templateKeys} template, ${environmentKeys} environment (partial); differences unavailable.`,
    );
  }
  if (report.issues.length > 0)
    lines.push("Review the reported configuration issues.");
  lines.push("No files were modified.", "");
  return lines.join("\n");
}
