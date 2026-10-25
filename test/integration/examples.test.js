import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const readme = readFileSync(join(root, "README.md"), "utf8");
const mismatch = [
  "bin/configpilot.js",
  "check",
  "--template",
  "examples/reference.txt",
  "--env",
  "examples/environment.txt",
];

function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  assert.equal(result.stderr, "");
  return result;
}

test("README terminal output matches the actual quick-start command and clean example exits zero", () => {
  const output = readme.match(/```text\n([\s\S]*?)\n```/);
  assert.ok(output, "README must show the complete quick-start output.");
  const result = run(mismatch);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, `${output[1]}\n`);
  const clean = run([
    "bin/configpilot.js",
    "check",
    "--template",
    "examples/reference.txt",
    "--env",
    "examples/reference.txt",
    "--json",
  ]);
  assert.equal(clean.status, 0);
  const report = JSON.parse(clean.stdout);
  assert.equal(report.comparison, "complete");
  assert.deepEqual(report.issues, []);
  assert.equal(report.summary.sharedKeys, 2);
  assert.equal(report.summary.missingKeys, 0);
  assert.equal(report.summary.undocumentedKeys, 0);
});

test("library example works outside the checkout, matches CLI JSON, and leaves inputs unchanged", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "configpilot example é "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const fixtures = ["examples/reference.txt", "examples/environment.txt"];
  const before = fixtures.map((file) => readFileSync(join(root, file)));
  const result = run([join(root, "examples/analyze.mjs")], directory);
  assert.equal(result.status, 0);
  const cli = run([...mismatch, "--json"]);
  assert.equal(cli.status, 1);
  assert.deepEqual(JSON.parse(result.stdout), JSON.parse(cli.stdout));
  for (const [index, file] of fixtures.entries()) {
    assert.deepEqual(readFileSync(join(root, file)), before[index]);
  }
  assert.deepEqual(readdirSync(directory), []);
});

test("the README public API snippet executes with the documented results", () => {
  const snippet = readme.match(/```js\n([\s\S]*?)\n```/);
  assert.ok(snippet, "README must include an executable API example.");
  const result = run(["--input-type=module", "--eval", snippet[1]]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "complete\n2\ntrue\n2\nDUPLICATE_KEY\n");
});
