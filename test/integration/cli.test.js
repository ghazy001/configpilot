import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";

const cli = fileURLToPath(new URL("../../bin/configpilot.js", import.meta.url));
const metadata = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    timeout: 10_000,
    ...options,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}

test("actual CLI routes help/version to stdout and errors to stderr", () => {
  for (const args of [[], ["--help"], ["--version"]]) {
    const result = run(args);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.ok(result.stdout.endsWith("\n"));
  }
  assert.equal(run(["--version"]).stdout, `${metadata.version}\n`);

  for (const args of [["unknown"], ["--json"], ["--version", "extra"]]) {
    const result = run(args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /configpilot --help/);
    assert.doesNotMatch(result.stderr, /\bat file:|\bat .*\.js:\d/);
  }
});

test("runs in a Unicode directory with spaces without touching configuration", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "configpilot espace é "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const sentinel = "API_TOKEN=SYNTHETIC_TOKEN\nPASSWORD=SYNTHETIC_PASSWORD\n";
  const envPath = join(directory, ".env");
  writeFileSync(envPath, sentinel);
  const templatePath = join(directory, ".env.example");
  const template = "API_TOKEN=\nPASSWORD=\n";
  writeFileSync(templatePath, template);

  for (const args of [["--help"], ["--version"], ["check"], [sentinel]]) {
    const result = run(args, {
      cwd: directory,
      env: { ...process.env, NO_COLOR: "1", API_TOKEN: "SYNTHETIC_TOKEN" },
    });
    const output = result.stdout + result.stderr;
    assert.ok(!output.includes("SYNTHETIC_TOKEN"));
    assert.ok(!output.includes("SYNTHETIC_PASSWORD"));
    assert.ok(!output.includes("\u001b"));
    assert.equal(readFileSync(envPath, "utf8"), sentinel);
    assert.equal(readFileSync(templatePath, "utf8"), template);
  }
});
