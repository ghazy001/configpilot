import assert from "node:assert/strict";
import test from "node:test";
import { analyzeConfig } from "../../src/index.js";
import { formatJson } from "../../src/reporters/json.js";
import { formatTerminal } from "../../src/reporters/terminal.js";

test("terminal report explains mismatches, locations, actions, counts, and read-only behavior", () => {
  const report = analyzeConfig({
    template: "DATABASE_URL=x\nPORT=3000",
    environment: "PORT=4000\nREDIS_URL=y",
  });
  const output = formatTerminal(report);
  assert.match(
    output,
    /WARNING {2}Missing variable\n {2}DATABASE_URL \[MISSING_KEY\]/,
  );
  assert.match(output, /template "\.env\.example":1/);
  assert.match(output, /environment "\.env":2/);
  assert.match(output, /Action: Provide this key/);
  assert.match(output, /0 errors, 2 warnings, 0 info/);
  assert.match(output, /1 shared, 1 missing, 1 undocumented/);
  assert.match(output, /No files were modified/);
});

test("clean, duplicate, and skipped results render without invented locations or counts", () => {
  assert.match(
    formatTerminal(analyzeConfig({ template: "A=x", environment: "A=y" })),
    /No configuration issues found/,
  );
  const duplicate = formatTerminal(
    analyzeConfig({ template: "A=x\nA=y", environment: "A=x" }),
  );
  assert.match(duplicate, /First declaration: template "\.env\.example":1/);
  assert.match(duplicate, /0 errors, 1 warning/);
  const skipped = formatTerminal(
    analyzeConfig({ template: "invalid", environment: "A=x" }),
  );
  assert.match(
    skipped,
    /ERROR {2}Invalid declaration\n {2}INVALID_DECLARATION/,
  );
  assert.match(
    skipped,
    /INFO {2}Key comparison skipped\n {2}COMPARISON_SKIPPED/,
  );
  assert.match(skipped, /Comparison: skipped/);
  assert.match(skipped, /1 error, 0 warnings, 1 info/);
  assert.match(skipped, /partial.*differences unavailable/);
  assert.ok(!skipped.includes("null"));
});

test("both reporters escape terminal controls and format characters in public file labels", () => {
  const label = 'folder/quote"\n\u001b[31m\u009b\u202e\u2028\u{e0001}.env';
  const report = analyzeConfig({
    template: "A=SYNTHETIC_TOKEN",
    environment: "B=SYNTHETIC_PASSWORD",
    templateFile: label,
  });
  const json = formatJson(report);
  assert.deepEqual(JSON.parse(json), report);
  const terminal = formatTerminal(report);
  for (const output of [json, terminal]) {
    for (const unsafe of ["\u001b", "\u009b", "\u202e", "\u2028", "\u{e0001}"])
      assert.ok(!output.includes(unsafe));
    assert.ok(!output.includes("SYNTHETIC_TOKEN"));
    assert.ok(!output.includes("SYNTHETIC_PASSWORD"));
    assert.ok(output.endsWith("\n"));
  }
  assert.ok(terminal.includes("\\n\\u001b"));
});
