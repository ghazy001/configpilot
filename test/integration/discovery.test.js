import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  symlinkSync,
  existsSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
const cli = fileURLToPath(new URL("../../bin/configpilot.js", import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "configpilot discovery é "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function run(root, args, env = {}) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 15000,
    env: { ...process.env, NO_COLOR: "1", ...env },
  });
  assert.ifError(r.error);
  return r;
}
test("actual scan -> template -> local -> check works, JSON is deterministic and sources are never executed", (t) => {
  const root = fixture(t);
  const source =
    'import {writeFileSync} from "node:fs"; writeFileSync("EXECUTED", "bad"); process.env.PORT ?? 3000; process.env.API_TOKEN || "SYNTHETIC_SOURCE_SECRET";';
  writeFileSync(join(root, "server.js"), source);
  const first = run(root, ["scan", "--json"]),
    second = run(root, ["scan", "--json", "--no-color", "--verbose"], {
      FORCE_COLOR: "1",
    });
  assert.equal(first.status, 0);
  assert.equal(first.stdout, second.stdout);
  assert.equal(first.stderr, "");
  assert.equal(JSON.parse(first.stdout).variables.length, 2);
  assert.ok(!existsSync(join(root, "EXECUTED")));
  for (const flags of [["--dry-run"], ["--dry-run", "--json"]]) {
    const r = run(root, ["init", ...flags]);
    assert.equal(r.status, 0);
    assert.ok(!r.stdout.includes("SYNTHETIC_SOURCE_SECRET"));
  }
  assert.equal(run(root, ["init"]).status, 2);
  assert.equal(run(root, ["init", "--template", "--yes"]).status, 0);
  assert.equal(run(root, ["init", "--yes"]).status, 0);
  assert.equal(run(root, ["check", "--json"]).status, 0);
  const before = readFileSync(join(root, ".env"));
  assert.equal(run(root, ["init", "--yes"]).status, 2);
  assert.deepEqual(readFileSync(join(root, ".env")), before);
  assert.equal(readFileSync(join(root, "server.js"), "utf8"), source);
});
test("malformed, binary and oversized source fails closed for init without secret output", (t) => {
  const root = fixture(t);
  writeFileSync(join(root, "broken.ts"), 'const x = "SYNTHETIC_BROKEN_SECRET');
  writeFileSync(join(root, "binary.js"), "\0SYNTHETIC_BINARY_SECRET");
  writeFileSync(join(root, "huge.js"), " ".repeat(262145));
  for (const flags of [[], ["--json"], ["--verbose"]]) {
    const r = run(root, ["scan", ...flags]);
    assert.equal(r.status, 1);
    assert.ok(!r.stdout.includes("SYNTHETIC_"));
  }
  assert.equal(run(root, ["init", "--yes"]).status, 2);
  assert.ok(!existsSync(join(root, ".env")));
});
test("default exclusions, paths, dynamic names, symlinks and argument failures are safe", (t) => {
  const root = fixture(t);
  mkdirSync(join(root, "src é"));
  writeFileSync(
    join(root, "src é", "page.tsx"),
    "const e = <div>{import.meta.env.VITE_API_URL}</div>; process.env[dynamicName]",
  );
  for (const excluded of [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    "vendor",
  ]) {
    mkdirSync(join(root, excluded));
    writeFileSync(join(root, excluded, "a.js"), "process.env.IGNORED");
  }
  const r = run(root, ["scan", "--path", "src é", "--json"]);
  assert.equal(r.status, 0);
  const report = JSON.parse(r.stdout);
  assert.equal(report.variables[0].name, "VITE_API_URL");
  assert.equal(report.issues[0].code, "SOURCE_DYNAMIC_REFERENCE");
  for (const args of [
    ["scan", "--path", ".."],
    ["scan", "--path"],
    ["scan", "--json", "--json"],
    ["init", "--output", "../outside", "--yes"],
    ["init", "--template", "--output", "../outside", "--dry-run"],
  ])
    assert.equal(run(root, args).status, 2);
  if (process.platform !== "win32") {
    const other = fixture(t);
    writeFileSync(join(other, "private.js"), "process.env.OUTSIDE_SECRET");
    symlinkSync(other, join(root, "external"));
    const s = run(root, ["scan", "--json"]);
    assert.equal(s.status, 0);
    assert.ok(!s.stdout.includes("OUTSIDE_SECRET"));
  }
});
