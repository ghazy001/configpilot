import { formatJson } from "./json.js";
import { writer, terminalHeader, diagnosticCounts } from "./terminal.js";
import { classifyVariable } from "../discovery/source.js";

const quoted = (value) => formatJson(value).trimEnd();
const location = (value) => `${quoted(value.file)}:${value.line}`;
const missing = (variable) =>
  !variable.frameworkProvided &&
  (variable.inTemplate === false ||
    (variable.inEnvironment === false && variable.potentiallyRequired));
export function discoveryNextStep(report) {
  if (!report.complete)
    return [
      "Review skipped or invalid inputs before creating configuration.",
      "configpilot scan --verbose",
    ];
  if (
    !report.variables.length &&
    !report.configuration.template &&
    !report.configuration.environment
  )
    return [
      "No named keys resolved. Review dynamic lookups or select your source directory.",
      "configpilot scan --path ./src --verbose",
    ];
  const { template, environment, detected = [] } = report.configuration;
  if (
    (environment && environment !== ".env") ||
    (template &&
      template !== ".env.example" &&
      (template !== ".env.sample" || detected.includes(".env.example")))
  )
    return [
      "Selected files use custom names. Choose their paths with check --template FILE --env FILE.",
      "configpilot check --help",
    ];
  if (!template || template === ".env.sample")
    return [
      "Create a safe reference template, then a private local file.",
      "configpilot init --template",
    ];
  if (!report.configuration.environment)
    return [
      "Create the private local file from source and selected template keys.",
      "configpilot init",
    ];
  return [
    "Review configuration consistency. Values and runtime provisioning are not validated.",
    "configpilot check",
  ];
}
function variableAction(variable) {
  if (variable.potentiallySensitive)
    return variable.category === "Public frontend configuration"
      ? "Keep credentials server-side; public-prefixed keys may be exposed."
      : "Supply real credentials privately; keep template values empty.";
  if (variable.inTemplate === false)
    return "Document this key in the selected template if intentional.";
  if (variable.inEnvironment === false && variable.potentiallyRequired)
    return "Add locally or verify deployment provisioning.";
  if (variable.frameworkProvided)
    return "Review bundler documentation; no local declaration is assumed necessary.";
  if (variable.hasStaticFallback)
    return "Review the fallback in source before deciding whether to set this key.";
  return "Review runtime requirements before supplying a value.";
}

export function formatDiscovery(report, options = {}) {
  const terminal = writer(options),
    { line, row, detail, rule, metrics, panel, result } = terminal;
  terminalHeader(terminal, "SCAN", "Environment discovery", options);
  const secrets = report.variables.filter((v) => v.potentiallySensitive).length;
  const defaults = report.variables.filter((v) => v.hasStaticFallback).length;
  const dynamic = report.issues.filter(
    (i) => i.code === "SOURCE_DYNAMIC_REFERENCE",
  ).length;
  row(
    `${report.complete ? (options.unicode ? "✓" : "[ok]") : "[!]"} ${report.complete ? "Scan completed" : "Scan incomplete"}`,
    `${report.filesScanned} ${report.filesScanned === 1 ? "FILE" : "FILES"}`,
    report.complete ? "success" : "warning",
  );
  line();
  metrics(diagnosticCounts(report.issues));
  line();
  line(
    `${report.variables.length} variables / ${secrets} potential ${secrets === 1 ? "secret" : "secrets"} / ${defaults} with defaults`,
    "key",
  );
  if (dynamic)
    line(
      `${dynamic} unresolved lookups need review. No variable names were guessed.`,
      "warning",
    );
  detail(
    "Template",
    report.configuration.template
      ? quoted(report.configuration.template)
      : "not selected",
    "path",
  );
  detail(
    "Local",
    report.configuration.environment
      ? quoted(report.configuration.environment)
      : "not selected",
    "path",
  );
  line();
  row("Discovered variables", "STATUS");
  line();
  if (!report.variables.length)
    line("No named environment-variable references found.", "muted");
  const visible = options.verbose
    ? report.variables
    : report.variables.slice(0, 30);
  for (const variable of visible) {
    const badges = [];
    if (variable.potentiallySensitive)
      badges.push(
        variable.category === "Public frontend configuration"
          ? "PUBLIC + SENSITIVE"
          : "Potential secret",
      );
    if (variable.frameworkProvided) badges.push("Framework-provided");
    if (variable.inTemplate === false && !variable.frameworkProvided)
      badges.push("Not documented");
    if (variable.inEnvironment === false && variable.potentiallyRequired)
      badges.push("No local declaration; may be external");
    if (variable.hasStaticFallback) badges.push("Static fallback observed");
    if (!badges.length) badges.push("Requiredness unknown");
    const status = variable.potentiallySensitive
      ? badges[0]
      : variable.frameworkProvided
        ? "Framework"
        : missing(variable)
          ? "Needs review"
          : variable.hasStaticFallback
            ? "Default detected"
            : "Referenced";
    const tone =
      missing(variable) || variable.potentiallySensitive
        ? "warning"
        : variable.hasStaticFallback
          ? "success"
          : "info";
    row(`${options.unicode ? "›" : ">"} ${variable.name}`, status, "key", tone);
    const refs = options.verbose
      ? variable.references
      : variable.references.slice(0, 1);
    for (const ref of refs) detail("Source", location(ref.location), "path");
    detail("Message", badges.join(" / "));
    detail("Action", variableAction(variable));
    if (!options.verbose && variable.referenceCount > 1)
      detail(
        "More",
        `+${variable.referenceCount - 1} references; use --verbose for locations.`,
      );
    if (options.verbose)
      detail(
        "Purpose",
        `${variable.category}; confidence: ${variable.confidence}. ${variable.purpose}`,
      );
    line();
  }
  if (visible.length < report.variables.length)
    line(
      `${report.variables.length - visible.length} more names; use --verbose or --json for the full list.`,
      "muted",
    );
  const allNotes = report.issues.filter((i) => options.verbose || !i.name);
  const notes = options.verbose ? allNotes : allNotes.slice(0, 20);
  if (notes.length) {
    line(options.verbose ? "Diagnostic details" : "Scan notes", "key");
    line();
    for (const issue of notes) {
      row(
        issue.name ?? issue.code,
        issue.severity.toUpperCase(),
        "key",
        issue.severity,
      );
      if (issue.name) detail("Finding", issue.code);
      detail("Message", issue.message);
      if (issue.location) detail("Source", location(issue.location), "path");
      line();
    }
  }
  if (notes.length < allNotes.length)
    line(
      `${allNotes.length - notes.length} additional notes omitted; use --verbose or --json for complete findings.`,
      "muted",
    );
  rule();
  line();
  const [body, command] = discoveryNextStep(report);
  panel({ body, commands: [command] });
  line();
  line(
    "Static references are not proof of requiredness. No files were modified.",
    "muted",
  );
  return result();
}

function initializationSteps({ output, publicTemplate, hasTemplate }) {
  if (output !== ".env" && output !== ".env.example")
    return {
      body: `Review every placeholder. ${publicTemplate ? "Prepare a matching private local file, then select this template with --template" : "Supply credentials privately, then select this local file with --env"} and its counterpart explicitly.`,
      commands: ["configpilot check --help"],
    };
  if (publicTemplate)
    return {
      body: "Review the public template, create a private local file, then fill required values before checking.",
      commands: ["configpilot init", "configpilot check"],
    };
  return {
    body: `Open ${quoted(output)} and review every placeholder. Supply credentials privately; keep this file out of Git.`,
    commands: hasTemplate
      ? ["configpilot check"]
      : ["configpilot init --template", "configpilot check"],
  };
}

export function formatInitializationPreview(
  { report, content, output, ignore, warnings, exists = false, dryRun = false },
  options = {},
) {
  const terminal = writer(options),
    { line, row, detail, metrics, panel, result } = terminal;
  terminalHeader(terminal, "INIT", "Safe environment initialization", options);
  const assignments = content
    .split("\n")
    .filter((row) => row && !row.startsWith("#"));
  const secrets = assignments.filter(
    (row) =>
      classifyVariable(row.slice(0, row.indexOf("="))).potentiallySensitive,
  ).length;
  row(
    assignments.length
      ? "Configuration preview ready"
      : "No configurable names found",
    exists ? "EXISTS" : dryRun ? "DRY RUN" : "REVIEW",
    "key",
    exists ? "warning" : "info",
  );
  line();
  metrics(diagnosticCounts(report.issues, warnings));
  line();
  line(
    `${assignments.length} placeholders / ${secrets} potential ${secrets === 1 ? "secret" : "secrets"}`,
    "key",
  );
  line(
    `${report.variables.length} names discovered in source; selected configuration keys are retained.`,
    "muted",
  );
  line();
  detail("Destination", quoted(output), "path");
  detail(
    "Protection",
    exists
      ? "Already exists; preview only, never overwritten."
      : "Exclusive creation; existing files are never overwritten.",
    exists ? "warning" : "muted",
  );
  const labels = {
    ignored: "Ignored by Git",
    "not-ignored": "Not ignored by Git",
    unknown: "Git ignore status unavailable",
    "public-template": "Public template: safe placeholders only",
  };
  detail(
    "Git status",
    labels[ignore],
    ignore === "ignored" || ignore === "public-template"
      ? "success"
      : "warning",
  );
  for (const warning of warnings) detail("Safety", warning, "warning");
  line();
  row("Safe configuration preview", "PLACEHOLDERS");
  line();
  if (!assignments.length)
    line("No configurable names were found. No file will be created.", "muted");
  else {
    for (const assignment of assignments.slice(
      0,
      options.verbose ? assignments.length : 12,
    ))
      line(assignment, "key");
    if (!options.verbose && assignments.length > 12)
      line(
        `${assignments.length - 12} more placeholders; use --verbose to preview all.`,
        "muted",
      );
    line();
    line(
      "Empty values need review. Development hints are not production defaults.",
      "muted",
    );
  }
  line();
  panel(
    !assignments.length
      ? {
          body: "Review source scope and unresolved lookups before creating configuration.",
          commands: ["configpilot scan --verbose"],
        }
      : exists
        ? {
            body: "Existing files are protected. Review a different destination with --output; no overwrite is available.",
            commands: ["configpilot init --help"],
          }
        : dryRun
          ? {
              body: "Review the placeholders, then explicitly approve creation of a new file.",
              commands: [
                output === ".env.example"
                  ? "configpilot init --template"
                  : output === ".env"
                    ? "configpilot init"
                    : "configpilot init --help",
              ],
            }
          : {
              title: "Next Steps after confirmation",
              ...initializationSteps({
                output,
                publicTemplate: ignore === "public-template",
                hasTemplate: report.configuration.template === ".env.example",
              }),
            },
  );
  return result();
}

export function formatInitializationSuccess(
  { output, publicTemplate, warnings, hasTemplate },
  options = {},
) {
  const terminal = writer(options),
    { line, row, metrics, panel, result } = terminal;
  terminalHeader(terminal, "INIT", "Environment initialization", options);
  row(
    `${options.unicode ? "✓" : "[ok]"} Created ${quoted(output)}.`,
    "CREATED",
    "success",
    "success",
  );
  line();
  metrics(diagnosticCounts([], warnings));
  line();
  for (const warning of warnings) {
    line(warning, "warning");
    line();
  }
  panel(initializationSteps({ output, publicTemplate, hasTemplate }));
  line();
  line(
    "Check validates syntax and declared keys, not values or deployment readiness.",
    "muted",
  );
  return result();
}
