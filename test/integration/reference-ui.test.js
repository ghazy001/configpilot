import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { analyzeConfig } from "../../src/index.js";
const cli = fileURLToPath(new URL("../../bin/configpilot.js", import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "configpilot layout é "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(
    join(root, "app.ts"),
    'process.env.PORT ?? 3000; process.env.TOKEN || "SYNTHETIC_SOURCE_CREDENTIAL"',
  );
  writeFileSync(join(root, ".env.example"), "PORT=\nTOKEN=\n");
  writeFileSync(join(root, ".env"), "PORT=SYNTHETIC_ENV_CREDENTIAL\n");
  return root;
}
function run(root, args, extra = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 15000,
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      NO_COLOR: "1",
      TERM: "dumb",
      ...extra,
    },
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  for (const text of [result.stdout, result.stderr]) {
    assert.ok(!text.includes("SYNTHETIC_SOURCE_CREDENTIAL"));
    assert.ok(!text.includes("SYNTHETIC_ENV_CREDENTIAL"));
  }
  return result;
}
function cards(text) {
  for (const label of ["Errors", "Warnings", "Information", "Next Steps"])
    assert.ok(text.includes(label));
}

test("actual CLI uses the shared monochrome design across scan/init/check without modifying files", (t) => {
  const root = fixture(t),
    before = [
      readFileSync(join(root, ".env")),
      readFileSync(join(root, ".env.example")),
      readdirSync(root),
    ];
  for (const [args, status] of [
    [["scan"], 0],
    [["init", "--template", "--dry-run"], 0],
    [["check"], 1],
  ]) {
    const result = run(root, args);
    assert.equal(result.status, status);
    cards(result.stdout);
    assert.ok(!result.stdout.includes("\u001b"));
  }
  assert.deepEqual(readFileSync(join(root, ".env")), before[0]);
  assert.deepEqual(readFileSync(join(root, ".env.example")), before[1]);
  assert.deepEqual(readdirSync(root), before[2]);
});

test("display options do not alter actual check/scan/init JSON bytes or exit codes", (t) => {
  const root = fixture(t);
  for (const args of [
    ["check", "--json"],
    ["scan", "--json"],
    ["init", "--dry-run", "--json"],
  ]) {
    const base = run(root, args);
    const styled = run(root, [...args, "--verbose", "--no-color"]);
    assert.equal(base.status, styled.status);
    assert.equal(base.stdout, styled.stdout);
    assert.equal(styled.stderr, "");
    assert.ok(!styled.stdout.includes("\u001b"));
    assert.equal(JSON.parse(styled.stdout).schemaVersion, 1);
  }
  assert.deepEqual(
    JSON.parse(run(root, ["check", "--json"]).stdout),
    analyzeConfig({
      template: "PORT=\nTOKEN=\n",
      environment: "PORT=SYNTHETIC_ENV_CREDENTIAL\n",
    }),
  );
});

test("actual CLI renders successful, syntax-error, empty and operational-error states accurately", (t) => {
  const root = fixture(t);
  let r = run(root, ["check", "--env", ".env.example"]);
  assert.equal(r.status, 0);
  cards(r.stdout);
  assert.match(r.stdout, /CLEAN/);
  writeFileSync(join(root, ".env"), "BROKEN\n");
  r = run(root, ["check"]);
  assert.equal(r.status, 1);
  cards(r.stdout);
  assert.match(r.stdout, /ERRORS/);
  assert.match(r.stdout, /INVALID_DECLARATION/);
  assert.match(r.stdout, /COMPARISON_SKIPPED/);
  writeFileSync(join(root, ".env.example"), "");
  writeFileSync(join(root, ".env"), "");
  r = run(root, ["check"]);
  assert.equal(r.status, 0);
  cards(r.stdout);
  assert.match(r.stdout, /Keys: 0 template, 0 environment/);
  r = run(root, ["check", "--env", "missing.env"]);
  assert.equal(r.status, 2);
  assert.equal(r.stdout, "");
  cards(r.stderr);
  assert.match(r.stderr, /FILE_NOT_FOUND/);
  r = run(root, ["init", "--yes"]);
  assert.equal(r.status, 2);
  cards(r.stderr);
  assert.match(r.stderr, /INIT_EXISTS/);
});
