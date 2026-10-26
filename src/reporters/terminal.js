import { formatJson } from "./json.js";

const TITLES = {
  MISSING_KEY: "Missing variable",
  UNDOCUMENTED_KEY: "Undocumented variable",
  DUPLICATE_KEY: "Duplicate variable",
  INVALID_DECLARATION: "Invalid declaration",
  UNSUPPORTED_MULTILINE: "Unsupported multiline value",
  COMPARISON_SKIPPED: "Key comparison skipped",
};
const COLORS = {
  brand: 36,
  error: 31,
  warning: 33,
  info: 34,
  success: 32,
  muted: 90,
  key: 1,
};

/** Stream capabilities are injected; analysis never reads the process environment. */
export function terminalOptions(stream, env = {}) {
  const dumb = env.TERM === "dumb";
  const forced = ["", "1", "2", "3"].includes(env.FORCE_COLOR);
  return {
    color:
      !dumb &&
      !env.NO_COLOR &&
      env.FORCE_COLOR !== "0" &&
      (forced || Boolean(stream.isTTY)),
    unicode:
      !dumb &&
      Boolean(stream.isTTY) &&
      Boolean(
        env.WT_SESSION ||
        env.TERM_PROGRAM ||
        /utf-?8/i.test(env.LC_ALL || env.LC_CTYPE || env.LANG || ""),
      ),
    width: stream.columns,
  };
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
function cellWidth(text) {
  if (/\p{Extended_Pictographic}/u.test(text)) return 2;
  const code = text.codePointAt(0);
  if (/^\p{Mark}+$/u.test(text)) return 0;
  return code >= 0x1100 &&
    (code <= 0x115f ||
      code === 0x2329 ||
      code === 0x232a ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe6f) ||
      (code >= 0xff01 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      code >= 0x20000)
    ? 2
    : 1;
}

function writer(options) {
  const width = Number.isFinite(options.width)
    ? Math.max(4, Math.min(100, Math.floor(options.width)))
    : 80;
  const indent = width < 30 ? "" : "  ";
  const lines = [];
  function line(text = "", tone) {
    if (!text) {
      lines.push("");
      return;
    }
    let current = "";
    let cells = 0;
    const flush = () => {
      const value = indent + current.trimEnd();
      lines.push(
        options.color && tone
          ? `\u001b[${COLORS[tone]}m${value}\u001b[0m`
          : value,
      );
      current = "";
      cells = 0;
    };
    // Wrap at spaces where possible, and split long labels without losing characters.
    for (const word of text.split(/( +)/u)) {
      // Escaped labels can contain thousands of ASCII characters. Avoid ICU's
      // grapheme segmentation cost for this common, unambiguous case.
      const ascii = /^[ -~]*$/u.test(word);
      const parts = ascii
        ? word.split("")
        : Array.from(segmenter.segment(word), ({ segment }) => segment);
      const size = ascii
        ? word.length
        : parts.reduce((sum, part) => sum + cellWidth(part), 0);
      if (current && cells + size > width - indent.length) flush();
      if (!current && /^ +$/u.test(word)) continue;
      for (const part of parts) {
        const size = ascii ? 1 : cellWidth(part);
        if (current && cells + size > width - indent.length) flush();
        current += part;
        cells += size;
      }
    }
    if (current) flush();
  }
  return { line, result: () => (lines.length ? lines.join("\n") + "\n" : "") };
}

function locationText(location, source) {
  return `${source} ${formatJson(location.file).trimEnd()}:${location.line}`;
}

export function formatTerminal(report, options = {}) {
  const { line, result } = writer(options);
  const icon = (unicode, ascii) => (options.unicode ? unicode : ascii);
  if (!options.quiet) {
    line(`${icon("◈", ">")} ConfigPilot`, "brand");
    line("Environment Configuration Diagnostics", "muted");
    line();
    line(
      `Template  ${formatJson(options.templateFile ?? ".env.example").trimEnd()}`,
      "brand",
    );
    line(
      `Target    ${formatJson(options.environmentFile ?? ".env").trimEnd()}`,
      "brand",
    );
    line();
    if (!report.issues.length) {
      line(`${icon("✔", "[ok]")} No configuration issues found.`, "success");
      line(
        "Syntax and declared keys match. Values and deployment configuration were not validated.",
      );
    } else
      line(
        `${report.issues.length} configuration ${report.issues.length === 1 ? "issue" : "issues"} found`,
        "key",
      );
    line();
  }
  for (const issue of report.issues) {
    const symbol =
      issue.severity === "error"
        ? icon("✖", "[x]")
        : issue.severity === "warning"
          ? icon("!", "[!]")
          : icon("ℹ", "[i]");
    line(
      `${symbol} ${issue.severity.toUpperCase()}  ${TITLES[issue.code] ?? issue.code}`,
      issue.severity,
    );
    line(issue.key ? `${issue.key} [${issue.code}]` : issue.code, "key");
    if (issue.location)
      line(`Location: ${locationText(issue.location, issue.source)}`, "brand");
    if (issue.relatedLocation)
      line(
        `First declaration: ${locationText(issue.relatedLocation, issue.source)}`,
        "brand",
      );
    line(issue.message);
    line(`Action: ${issue.recommendation}`);
    line();
  }
  if (!options.quiet) {
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
    line("Summary", "key");
    line(
      `${errors} ${errors === 1 ? "error" : "errors"}, ${warnings} ${warnings === 1 ? "warning" : "warnings"}, ${info} info.`,
    );
    line(`Comparison: ${report.comparison}`, "muted");
    line(
      report.comparison === "complete"
        ? `Keys: ${templateKeys} template, ${environmentKeys} environment; ${sharedKeys} shared, ${missingKeys} missing, ${undocumentedKeys} undocumented.`
        : `Keys: ${templateKeys} template, ${environmentKeys} environment (partial); differences unavailable.`,
    );
    if (options.verbose) {
      line();
      line(
        `Report schema: ${report.schemaVersion}. Analysis scope: selected files only.`,
        "muted",
      );
      line(
        "Checks: syntax, duplicate declarations, and key presence. External environment variables and variable values are not checked.",
        "muted",
      );
    }
    line();
    if (report.issues.length) line("Configuration needs attention.", "warning");
    line("No files were modified.", "muted");
  }
  return result();
}

export function formatCliError(error, options = {}) {
  const { line, result } = writer(options);
  line(
    `${options.unicode ? "✖" : "[x]"} ConfigPilot: ${error.code}${error.source ? ` (${error.source})` : ""}`,
    "error",
  );
  line();
  line(error.message);
  line(`Action: ${error.recommendation}`);
  if (error.code === "FILE_NOT_FOUND") {
    line();
    line(
      "Example: configpilot check --template .env.example --env .env",
      "muted",
    );
  }
  return result();
}
