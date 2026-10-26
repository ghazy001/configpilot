import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { analyzeConfig } from "../../src/index.js";
import {
  terminalOptions,
  formatTerminal,
  formatCliError,
} from "../../src/reporters/terminal.js";

test("color and Unicode policies respect each stream and explicit environment controls", () => {
  const tty = { isTTY: true, columns: 42 };
  assert.deepEqual(terminalOptions(tty, { LANG: "en_US.UTF-8" }), {
    color: true,
    unicode: true,
    width: 42,
  });
  for (const env of [
    { NO_COLOR: "1", FORCE_COLOR: "1" },
    { TERM: "dumb", FORCE_COLOR: "1" },
    { FORCE_COLOR: "0" },
  ])
    assert.equal(terminalOptions(tty, env).color, false);
  assert.equal(terminalOptions({}, {}).color, false);
  assert.equal(terminalOptions({}, { FORCE_COLOR: "1" }).color, true);
  assert.equal(terminalOptions({}, { FORCE_COLOR: "1" }).unicode, false);
  assert.equal(terminalOptions(tty, { WT_SESSION: "synthetic" }).unicode, true);
  assert.equal(
    terminalOptions(tty, { TERM: "dumb", WT_SESSION: "synthetic" }).unicode,
    false,
  );
  assert.equal(terminalOptions(tty, { LANG: "C" }).unicode, false);
});

test("color is presentation only and all findings remain visible in quiet mode", () => {
  const report = analyzeConfig({ template: "BAD", environment: "A=x" });
  const plain = formatTerminal(report);
  const colored = formatTerminal(report, { color: true });
  assert.equal(stripVTControlCharacters(colored), plain);
  assert.ok(colored.includes("\u001b[31m"));
  assert.ok(colored.includes("\u001b[34m"));
  const quiet = formatTerminal(report, { quiet: true });
  for (const issue of report.issues) assert.ok(quiet.includes(issue.code));
  assert.doesNotMatch(quiet, /Summary|ConfigPilot/);
  const clean = analyzeConfig({ template: "A=x", environment: "A=y" });
  assert.equal(formatTerminal(clean, { quiet: true }), "");
  assert.match(formatTerminal(clean, { unicode: true, color: true }), /✔/);
  assert.match(formatTerminal(clean, { verbose: true }), /Report schema: 1/);
});

test("stacked layout wraps long keys and Unicode paths without dropping graphemes", () => {
  const key = "LONG_".repeat(30);
  const path = "配置/e\u0301/".repeat(20) + ".env";
  const report = analyzeConfig({
    template: `${key}=SYNTHETIC_SECRET`,
    environment: "",
    templateFile: path,
  });
  for (const width of [12, 24, 40, 80, 140]) {
    const output = formatTerminal(report, { width, templateFile: path });
    for (const line of output.trimEnd().split("\n")) {
      // These fixtures use CJK (two cells), combining accents (zero), and ASCII.
      const cells = [...line].reduce(
        (sum, char) =>
          sum + (/\p{Mark}/u.test(char) ? 0 : /[配置]/u.test(char) ? 2 : 1),
        0,
      );
      assert.ok(
        cells <= Math.min(width, 100),
        `${cells} cells exceed ${width}`,
      );
    }
    assert.ok(output.replace(/\s/g, "").includes(key));
    assert.ok(output.replace(/\s/g, "").includes(path));
    assert.doesNotMatch(output, /SYNTHETIC_SECRET/);
    assert.ok(!output.includes("\u001b"));
  }
});

test("header labels escape controls and operational errors wrap safely", () => {
  const clean = analyzeConfig({ template: "", environment: "" });
  const output = formatTerminal(clean, {
    templateFile: "bad\u001b[31m\n.env",
    verbose: true,
  });
  assert.ok(!output.includes("\u001b"));
  assert.match(output, /\\u001b/);
  const error = formatCliError(
    {
      code: "FILE_NOT_FOUND",
      source: "template",
      message: "Selected input file was not found.",
      recommendation: "Check the selected path and working directory.",
    },
    { width: 24 },
  );
  assert.ok(error.split("\n").every((line) => line.length <= 24));
  assert.match(error, /Example:/);
});

test("CLI applies stdout/stderr capabilities independently and JSON bypasses both", async () => {
  const { runCli } = await import("../../src/cli.js");
  const display = {
    stdout: { color: true, unicode: true, width: 40 },
    stderr: { color: false, width: 24 },
  };
  const options = {
    version: "1.0.0",
    readFile: async () => "A=SYNTHETIC_SECRET",
    display,
  };
  const clean = await runCli(["check"], options);
  assert.equal(clean.exitCode, 0);
  assert.ok(clean.stdout.includes("\u001b[32m"));
  assert.match(clean.stdout, /✔/);
  const failure = await runCli(["check", "--unknown"], options);
  assert.equal(failure.exitCode, 2);
  assert.equal(failure.stdout, "");
  assert.ok(!failure.stderr.includes("\u001b"));
  assert.ok(failure.stderr.split("\n").every((line) => line.length <= 24));
  const json = await runCli(["check", "--json"], options);
  assert.equal(
    json.stdout,
    (await runCli(["check", "--json", "--verbose"], options)).stdout,
  );
  const errorJson = await runCli(["check", "--json", "--unknown"], options);
  assert.deepEqual(
    JSON.parse(errorJson.stdout).error.code,
    "INVALID_ARGUMENTS",
  );
  assert.ok(!errorJson.stdout.includes("\u001b"));
});

test("maximum escaped labels render within a bounded isolated process", async () => {
  const { spawnSync } = await import("node:child_process");
  const { default: process } = await import("node:process");
  const source = `
    import { analyzeConfig } from ${JSON.stringify(new URL("../../src/index.js", import.meta.url).href)};
    import { formatTerminal } from ${JSON.stringify(new URL("../../src/reporters/terminal.js", import.meta.url).href)};
    const report = analyzeConfig({ template: "bad\\n".repeat(32), environment: "bad\\n".repeat(32), templateFile: "\\u0001".repeat(4096), environmentFile: "\\u0001".repeat(4096) });
    const output = formatTerminal(report);
    if (!output.includes("INVALID_DECLARATION") || output.includes("\\u0001")) throw new Error("Unsafe output");
  `;
  const child = spawnSync(
    process.execPath,
    ["--max-old-space-size=128", "--input-type=module", "--eval", source],
    { encoding: "utf8", timeout: 10_000 },
  );
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, "");
});
