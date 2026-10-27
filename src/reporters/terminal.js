import { formatJson } from "./json.js";

const TITLES = {
  MISSING_KEY: "Missing variable",
  UNDOCUMENTED_KEY: "Undocumented variable",
  DUPLICATE_KEY: "Duplicate variable",
  INVALID_DECLARATION: "Invalid declaration",
  UNSUPPORTED_MULTILINE: "Unsupported multiline value",
  COMPARISON_SKIPPED: "Key comparison skipped",
};
const TERMINAL_DETAILS = {
  MISSING_KEY: [
    "No local declaration was found. This key may be supplied externally.",
    "Provide it locally or verify deployment provisioning before changing files.",
  ],
  UNDOCUMENTED_KEY: [
    "This local key is absent from the reference template; setup instructions may be incomplete.",
    "Document it if intentional, or review whether it is still used.",
  ],
  DUPLICATE_KEY: [
    "Multiple declarations can cause loader-dependent overrides.",
    "Keep one intentional declaration for this key.",
  ],
  INVALID_DECLARATION: [
    "This declaration does not match the supported dotenv syntax.",
    "Use NAME=value with a portable name and complete single-line quotes.",
  ],
  UNSUPPORTED_MULTILINE: [
    "Physical multiline values are unsupported; key comparison cannot safely continue.",
    "Use a supported single-line representation or exclude this input.",
  ],
  COMPARISON_SKIPPED: [
    "Key differences are unavailable until both inputs parse completely.",
    "Resolve the syntax findings, then run check again.",
  ],
};
const COLORS = {
  brand: "1;36",
  path: 36,
  error: 31,
  warning: 33,
  info: 94,
  success: 32,
  muted: 90,
  key: 1,
  metricError: "1;31",
  metricWarning: "1;33",
  metricInfo: "1;94",
  metricZero: "1;37",
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
  if (
    /\p{Emoji_Presentation}|\p{Regional_Indicator}{2}|\u20e3|\ufe0f/u.test(text)
  )
    return 2;
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

export function textWidth(text) {
  if (/^[ -~]*$/u.test(text)) return text.length;
  return Array.from(segmenter.segment(text), ({ segment }) =>
    cellWidth(segment),
  ).reduce((sum, size) => sum + size, 0);
}

function wrapText(text, limit) {
  const lines = [];
  let current = "",
    cells = 0;
  const flush = () => {
    lines.push(current.trimEnd());
    current = "";
    cells = 0;
  };
  for (const word of text.split(/( +)/u)) {
    const ascii = /^[ -~]*$/u.test(word);
    const parts = ascii
      ? word.split("")
      : Array.from(segmenter.segment(word), ({ segment }) => segment);
    const size = ascii
      ? word.length
      : parts.reduce((sum, part) => sum + cellWidth(part), 0);
    if (current && cells + size > limit && !(size > limit && cells <= 4))
      flush();
    if (!current && /^ +$/u.test(word)) continue;
    for (const part of parts) {
      const size = ascii ? 1 : cellWidth(part);
      if (current && cells + size > limit) flush();
      current += part;
      cells += size;
    }
  }
  if (current) flush();
  return lines;
}

/** Shared cell-aware layout. All geometry is computed before ANSI styling. */
export function writer(options = {}) {
  const width = Number.isFinite(options.width)
    ? Math.max(4, Math.min(160, Math.floor(options.width)))
    : 80;
  const indent = width < 30 ? "" : "  ";
  const available = width - indent.length;
  const lines = [];
  const border = options.unicode
    ? { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" }
    : { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|" };
  const paint = (text, tone, background) =>
    options.color && (tone || background)
      ? `\u001b[${[tone ? COLORS[tone] : null, background].filter(Boolean).join(";")}m${text}\u001b[0m`
      : text;
  const emit = (parts) =>
    lines.push(
      indent +
        parts
          .map(({ text, tone, background }) => paint(text, tone, background))
          .join(""),
    );
  const center = (text, size) => {
    const spaces = Math.max(0, size - textWidth(text));
    return (
      " ".repeat(Math.floor(spaces / 2)) +
      text +
      " ".repeat(Math.ceil(spaces / 2))
    );
  };
  function line(text = "", tone) {
    if (!text) {
      lines.push("");
      return;
    }
    for (const row of wrapText(text, available)) emit([{ text: row, tone }]);
  }
  function row(left, right = "", tone = "key", badgeTone = "muted") {
    const badge = right ? `[ ${right} ]` : "";
    const gap = available - textWidth(left) - textWidth(badge);
    if (badge && gap >= 2)
      emit([
        { text: left, tone },
        { text: " ".repeat(gap) },
        { text: badge, tone: badgeTone, background: "40" },
      ]);
    else {
      line(left, tone);
      if (badge) detail("Status", right, badgeTone);
    }
  }
  function detail(label, text, tone = "muted") {
    const stacked = available < 42;
    const prefix = stacked ? "  " : "  " + `${label}:`.padEnd(13);
    if (stacked) line(`${label}:`, "muted");
    for (const [index, value] of wrapText(
      text,
      Math.max(2, available - prefix.length),
    ).entries()) {
      emit([
        {
          text: index || stacked ? " ".repeat(prefix.length) : prefix,
          tone: "muted",
        },
        { text: value, tone },
      ]);
    }
  }
  function rule() {
    line(border.h.repeat(available), "muted");
  }
  function metrics({ errors = 0, warnings = 0, info = 0 }) {
    const entries = [
      ["Errors", errors, "error"],
      ["Warnings", warnings, "warning"],
      ["Information", info, "info"],
    ];
    if (available < 24) {
      for (const [label, count, tone] of entries)
        line(`${label}: ${count}`, count ? tone : "muted");
      return;
    }
    const sideBySide = available >= 54;
    const sizes = sideBySide
      ? entries.map(
          (_, i) =>
            Math.floor((available - 4) / 3) + (i < (available - 4) % 3 ? 1 : 0),
        )
      : entries.map(() => available);
    const cards = entries.map(([label, count, tone], i) => {
      const size = sizes[i] - 2;
      return [
        [
          {
            text: border.tl + border.h.repeat(size) + border.tr,
            tone: "muted",
          },
        ],
        [
          { text: border.v, tone: "muted" },
          {
            text: center(String(count), size),
            tone: count
              ? `metric${tone[0].toUpperCase() + tone.slice(1)}`
              : "metricZero",
            background: "40",
          },
          { text: border.v, tone: "muted" },
        ],
        [
          { text: border.v, tone: "muted" },
          { text: center(label, size), tone: "muted", background: "40" },
          { text: border.v, tone: "muted" },
        ],
        [
          {
            text: border.bl + border.h.repeat(size) + border.br,
            tone: "muted",
          },
        ],
      ];
    });
    if (sideBySide)
      for (let i = 0; i < 4; i++)
        emit(
          cards.flatMap((card, j) =>
            j ? [{ text: "  " }, ...card[i]] : card[i],
          ),
        );
    else for (const card of cards) for (const row of card) emit(row);
  }
  function panel({ title = "Next Steps", body = "", commands = [] }) {
    if (available < 24) {
      line(title, "brand");
      if (body) line(body);
      for (const command of commands) line(`> ${command}`, "brand");
      return;
    }
    const size = available - 4;
    const framed = (text, tone, background = "40") =>
      emit([
        { text: border.v, tone: "brand" },
        {
          text:
            " " + text + " ".repeat(Math.max(0, size - textWidth(text))) + " ",
          tone,
          background,
        },
        { text: border.v, tone: "brand" },
      ]);
    line(border.tl + border.h.repeat(available - 2) + border.tr, "brand");
    for (const row of wrapText(title, size)) framed(row, "brand");
    if (body) {
      framed("");
      for (const row of wrapText(body, size)) framed(row);
    }
    if (commands.length) framed("");
    for (const command of commands)
      for (const row of wrapText(
        `${options.unicode ? "›" : ">"} ${command}`,
        size,
      ))
        framed(row, "brand", "44");
    line(border.bl + border.h.repeat(available - 2) + border.br, "brand");
  }
  return {
    line,
    row,
    detail,
    rule,
    metrics,
    panel,
    width,
    result: () => (lines.length ? lines.join("\n") + "\n" : ""),
  };
}

export function terminalHeader(terminal, command, subtitle, options = {}) {
  terminal.row(`${options.unicode ? "◈" : ">"} ConfigPilot`, command, "brand");
  terminal.line(subtitle, "muted");
  terminal.line();
  terminal.rule();
  terminal.line();
}

export function diagnosticCounts(issues, warnings = []) {
  return {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings:
      issues.filter((issue) => issue.severity === "warning").length +
      warnings.length,
    info: issues.filter((issue) => issue.severity === "info").length,
  };
}

function locationText(location, source) {
  return `${source} ${formatJson(location.file).trimEnd()}:${location.line}`;
}

export function formatTerminal(report, options = {}) {
  const terminal = writer(options);
  const { line, row, detail, rule, metrics, panel, result } = terminal;
  const icon = (unicode, ascii) => (options.unicode ? unicode : ascii);
  const state = report.summary.errors
    ? "error"
    : report.summary.warnings
      ? "warning"
      : report.summary.info
        ? "info"
        : "success";
  const status = {
    error: "ERRORS",
    warning: "REVIEW",
    info: "INFO",
    success: "CLEAN",
  }[state];
  if (!options.quiet) {
    terminalHeader(
      terminal,
      "CHECK",
      "Environment configuration diagnostics",
      options,
    );
    row(
      `${state === "error" ? icon("✖", "[x]") : state === "warning" ? "!" : icon("✔", "[ok]")} ${report.issues.length ? "Analysis completed" : "No configuration issues found."}`,
      status,
      state,
      state,
    );
    line();
    metrics(report.summary);
    line();
    detail(
      "Template",
      formatJson(options.templateFile ?? ".env.example").trimEnd(),
      "path",
    );
    detail(
      "Target",
      formatJson(options.environmentFile ?? ".env").trimEnd(),
      "path",
    );
    line();
    if (!report.issues.length)
      line(
        "Syntax and declared keys match. Values and deployment configuration were not validated.",
      );
    else row("Configuration diagnostics", "STATUS");
    line();
  }
  for (const severity of ["error", "warning", "info"]) {
    for (const issue of report.issues.filter(
      (issue) => issue.severity === severity,
    )) {
      const title = TITLES[issue.code] ?? issue.code;
      row(
        `${icon(severity === "error" ? "✖" : severity === "warning" ? "!" : "i", severity === "error" ? "[x]" : severity === "warning" ? "[!]" : "[i]")} ${issue.key ?? title}`,
        severity.toUpperCase(),
        "key",
        severity,
      );
      detail(
        "Finding",
        issue.key ? `${title} [${issue.code}]` : `[${issue.code}]`,
        severity,
      );
      if (issue.location)
        detail("Location", locationText(issue.location, issue.source), "path");
      if (issue.relatedLocation)
        detail(
          "First",
          locationText(issue.relatedLocation, issue.source),
          "path",
        );
      const [message, action] = TERMINAL_DETAILS[issue.code] ?? [
        issue.message,
        issue.recommendation,
      ];
      detail("Message", message);
      detail("Action", action);
      line();
    }
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
    rule();
    line();
    line("Summary", "key");
    line(
      `${errors} ${errors === 1 ? "error" : "errors"}, ${warnings} ${warnings === 1 ? "warning" : "warnings"}, ${info} info.`,
      "muted",
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
    panel({
      body: report.issues.length
        ? "Review the locations and actions above. Rerun your selected check after making intentional changes."
        : "Keep your reference template current. Recheck after changing configuration keys.",
      commands: [
        (options.templateFile ?? ".env.example") === ".env.example" &&
        (options.environmentFile ?? ".env") === ".env"
          ? "configpilot check"
          : "configpilot check --help",
      ],
    });
    line();
    if (report.issues.length) line("Configuration needs attention.", state);
    line("No files were modified.", "muted");
  }
  return result();
}

export function formatCliError(error, options = {}) {
  const terminal = writer(options),
    { line, row, detail, metrics, panel, result } = terminal;
  terminalHeader(
    terminal,
    (options.command ?? "check").toUpperCase(),
    "Environment configuration assistance",
    options,
  );
  row("Command could not complete", "ERROR", "error", "error");
  line();
  metrics({ errors: 1 });
  line();
  detail("Finding", error.code, "error");
  if (error.source) detail("Input", error.source);
  detail("Message", error.message);
  if (error.recommendation) detail("Action", error.recommendation);
  line();
  panel({
    body:
      error.code === "FILE_NOT_FOUND"
        ? "Check the selected path and working directory. Example:"
        : "Review usage before retrying; no existing configuration was overwritten.",
    commands: [
      error.code === "FILE_NOT_FOUND"
        ? "configpilot check --template .env.example --env .env"
        : `configpilot ${options.command ?? "check"} --help`,
    ],
  });
  return result();
}
