import assert from "node:assert/strict";
import test from "node:test";
import { stripVTControlCharacters } from "node:util";
import { analyzeConfig } from "../../src/index.js";
import {
  formatTerminal,
  formatCliError,
  writer,
  textWidth,
  diagnosticCounts,
} from "../../src/reporters/terminal.js";
import {
  formatDiscovery,
  formatInitializationPreview,
  formatInitializationSuccess,
} from "../../src/reporters/discovery.js";

const discovery = {
  complete: true,
  filesScanned: 0,
  variables: [],
  issues: [],
  configuration: { detected: [], template: null, environment: null },
};
const checkStates = [
  {
    report: analyzeConfig({
      template: "PORT=",
      environment: "PORT=SYNTHETIC_UI_SECRET",
    }),
    errors: 0,
    warnings: 0,
    info: 0,
  },
  {
    report: analyzeConfig({
      template: "PORT=",
      environment: "OTHER=SYNTHETIC_UI_SECRET",
    }),
    errors: 0,
    warnings: 2,
    info: 0,
  },
  {
    report: analyzeConfig({ template: "BROKEN", environment: "PORT=" }),
    errors: 1,
    warnings: 0,
    info: 1,
  },
  {
    report: analyzeConfig({ template: "", environment: "" }),
    errors: 0,
    warnings: 0,
    info: 0,
  },
];

test("reference layout renders three distinct count cards with exact diagnostic counts", () => {
  for (const { report, errors, warnings, info } of checkStates) {
    const output = formatTerminal(report, { width: 80 });
    const lines = output.split("\n");
    const index = lines.findIndex((row) => row.includes("+--"));
    assert.equal(
      (lines[index].match(/\+/g) ?? []).length,
      6,
      "three independent top borders",
    );
    assert.deepEqual(
      lines[index + 1]
        .trim()
        .split(/\|\s*\|/)
        .map((part) => part.replace(/[| ]/g, "")),
      [errors, warnings, info].map(String),
    );
    assert.match(lines[index + 2], /Errors.*Warnings.*Information/);
    assert.match(output, /Next Steps/);
    assert.ok(!output.includes("SYNTHETIC_UI_SECRET"));
  }
});

test("reference badges share a right edge and diagnostic details share a body column", () => {
  const report = analyzeConfig({ template: "A=\nB=", environment: "C=" });
  const output = formatTerminal(report, { width: 100 });
  const badges = output.split("\n").filter((row) => /\[ WARNING \]$/.test(row));
  assert.equal(badges.length, 3);
  assert.ok(badges.every((row) => textWidth(row) === 100));
  const details = output
    .split("\n")
    .filter((row) => /^ {4}(?:Finding|Location|Message|Action):/.test(row));
  assert.ok(details.length >= 12);
  const columns = details.map((row) => row.match(/^ {4}[^:]+:( +)/)[0].length);
  assert.ok(columns.every((column) => column === columns[0]));
});

test("all command surfaces share metric geometry, a highlighted command panel and width-safe borders", () => {
  for (const width of [40, 60, 80, 120, 160])
    for (const unicode of [false, true]) {
      const options = { width, unicode, color: true };
      const surfaces = [
        formatTerminal(checkStates[0].report, options),
        formatTerminal(checkStates[1].report, options),
        formatTerminal(checkStates[2].report, options),
        formatDiscovery(discovery, options),
        formatInitializationPreview(
          {
            report: discovery,
            content: "",
            output: ".env",
            ignore: "unknown",
            warnings: [],
            dryRun: true,
          },
          options,
        ),
        formatInitializationPreview(
          {
            report: discovery,
            content: "TOKEN=\n",
            output: ".env",
            ignore: "not-ignored",
            warnings: ["Keep this private."],
            exists: true,
            dryRun: true,
          },
          options,
        ),
        formatInitializationSuccess(
          {
            output: ".env",
            publicTemplate: false,
            warnings: [],
            hasTemplate: true,
          },
          options,
        ),
        formatCliError(
          {
            code: "FILE_NOT_FOUND",
            message: "Selected file not found.",
            recommendation: "Check the selected path.",
          },
          options,
        ),
      ];
      for (const output of surfaces) {
        const plain = stripVTControlCharacters(output);
        for (const line of plain.split("\n"))
          assert.ok(textWidth(line) <= width, `${textWidth(line)} > ${width}`);
        for (const label of ["Errors", "Warnings", "Information", "Next Steps"])
          assert.ok(plain.includes(label));
        const borders = plain
          .split("\n")
          .filter((line) =>
            unicode
              ? /^ {2}╭─+╮(?: {2}╭─+╮)*$/.test(line)
              : /^ {2}\+-+\+(?: {2}\+-+\+)*$/.test(line),
          );
        assert.ok(borders.length >= 2);
        assert.ok(borders.every((line) => textWidth(line) === width));
        assert.ok(
          output.includes(";44m"),
          "command area uses a distinct background",
        );
      }
    }
});

test("narrow cards stack, monochrome remains readable, and rendering does not mutate JSON data", () => {
  const report = checkStates[1].report,
    before = JSON.stringify(report);
  const output = formatTerminal(report, {
    width: 40,
    color: false,
    unicode: false,
  });
  const lines = output.split("\n");
  for (const label of ["Errors", "Warnings", "Information"]) {
    const row = lines.find((line) => line.includes(label));
    assert.ok(row.includes("|") && row.endsWith("|"));
    assert.equal((row.match(/\|/g) ?? []).length, 2);
  }
  assert.match(output, /\[ WARNING \]/);
  assert.match(output, /Location:/);
  assert.match(output, /Action:/);
  assert.ok(!output.includes("\u001b"));
  assert.equal(JSON.stringify(report), before);
  const colored = formatTerminal(report, {
    width: 40,
    color: true,
    unicode: false,
  });
  assert.equal(stripVTControlCharacters(colored), output);
  assert.deepEqual(
    diagnosticCounts(
      [{ severity: "error" }, { severity: "warning" }, { severity: "info" }],
      ["Git notice"],
    ),
    { errors: 1, warnings: 2, info: 1 },
  );
});

test("Unicode cells and very narrow fallback never lose names or insert cursor-control sequences", () => {
  assert.equal(textWidth("✔"), 1);
  assert.equal(textWidth("✔️"), 2);
  assert.equal(textWidth("配置"), 4);
  assert.equal(textWidth("e\u0301"), 1);
  const key = "LONG_".repeat(25),
    path = "配置/e\u0301/".repeat(12) + ".env";
  const report = analyzeConfig({
    template: `${key}=`,
    environment: "",
    templateFile: path,
  });
  for (const width of [4, 12, 24, 40, 60, 80, 120, 160]) {
    const output = formatTerminal(report, { width, unicode: true });
    assert.ok(output.split("\n").every((row) => textWidth(row) <= width));
    assert.ok(output.replace(/\s/g, "").includes(key));
    assert.ok(output.replace(/\s/g, "").includes(path));
    assert.ok(!output.includes("\u001b"));
  }
  const terminal = writer({ width: 80 });
  terminal.detail("Destination", "long-output.env");
  terminal.detail("Source", "src/app.ts:8");
  const rows = terminal.result().trimEnd().split("\n");
  assert.equal(
    rows[0].indexOf("long-output.env"),
    rows[1].indexOf("src/app.ts:8"),
  );
  const narrow = writer({ width: 40 });
  narrow.row("A".repeat(35), "WARNING");
  assert.match(narrow.result(), /Status:/);
});
