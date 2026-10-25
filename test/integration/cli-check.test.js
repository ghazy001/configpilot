import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import { analyzeConfig } from "../../src/index.js";

const cli = fileURLToPath(new URL("../../bin/configpilot.js", import.meta.url));

function fixture(t, template = "PORT=3000", environment = "PORT=4000") {
  const cwd = mkdtempSync(join(tmpdir(), "configpilot check é "));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  writeFileSync(join(cwd, ".env.example"), template);
  writeFileSync(join(cwd, ".env"), environment);
  return cwd;
}

function run(cwd, args = ["check"], env = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 10_000,
    env: { ...process.env, ...env },
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}

test("default check works outside the checkout and reports a realistic mismatch", (t) => {
  const cwd = fixture(
    t,
    "DATABASE_URL=example\nPORT=3000",
    "PORT=4000\nREDIS_URL=SYNTHETIC_REDIS_SECRET",
  );
  const result = run(cwd);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /DATABASE_URL \[MISSING_KEY\]/);
  assert.match(result.stdout, /REDIS_URL \[UNDOCUMENTED_KEY\]/);
  assert.match(result.stdout, /0 errors, 2 warnings, 0 info/);
  assert.match(result.stdout, /No files were modified/);
  assert.ok(!result.stdout.includes("SYNTHETIC_REDIS_SECRET"));
});

test("clean JSON output exactly matches the public API report and exits 0", (t) => {
  const template = "PORT=3000\nTOKEN=";
  const environment = "PORT=4000\nTOKEN=SYNTHETIC_TOKEN";
  const cwd = fixture(t, template, environment);
  const result = run(cwd, ["check", "--json"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.deepEqual(
    JSON.parse(result.stdout),
    analyzeConfig({ template, environment }),
  );
  assert.ok(result.stdout.endsWith("\n"));
});

test("relative and absolute explicit paths support spaces, Unicode, and equals signs", (t) => {
  const cwd = fixture(t);
  const folder = join(cwd, "配置 files");
  mkdirSync(folder);
  writeFileSync(join(folder, "ref=example.env"), "A=");
  writeFileSync(join(folder, "actual env.env"), "A=秘密");
  for (const args of [
    [
      "check",
      "--template",
      join("配置 files", "ref=example.env"),
      "--env",
      join("配置 files", "actual env.env"),
    ],
    [
      "check",
      `--template=${join(folder, "ref=example.env")}`,
      `--env=${join(folder, "actual env.env")}`,
      "--json",
    ],
  ]) {
    const result = run(cwd, args);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.ok(!result.stdout.includes("秘密"));
  }
  writeFileSync(join(cwd, "-private.env"), "A=x");
  assert.equal(
    run(cwd, ["check", "--template=-private.env", "--env=-private.env"]).status,
    0,
  );
});

test("missing inputs yield role-specific safe errors, including parseable JSON", (t) => {
  const cwd = fixture(t);
  for (const [flag, source] of [
    ["--template", "template"],
    ["--env", "environment"],
  ]) {
    for (const format of [[], ["--json"]]) {
      const result = run(cwd, [
        "check",
        `${flag}=SYNTHETIC_PATH_SECRET`,
        ...format,
      ]);
      assert.equal(result.status, 2);
      assert.ok(
        !(result.stdout + result.stderr).includes("SYNTHETIC_PATH_SECRET"),
      );
      if (format.length) {
        assert.equal(result.stderr, "");
        const data = JSON.parse(result.stdout);
        assert.equal(data.error.code, "FILE_NOT_FOUND");
        assert.equal(data.error.source, source);
        assert.ok(!data.issues);
      } else {
        assert.equal(result.stdout, "");
        assert.match(result.stderr, /FILE_NOT_FOUND/);
        assert.ok(result.stderr.includes(source));
      }
    }
  }
});

test("malformed and multiline input produce exit 1 and skipped analysis in both formats", (t) => {
  for (const environment of [
    "RAW_SYNTHETIC_SECRET",
    'TOKEN="first\nSYNTHETIC_BODY_SECRET=hidden\n"',
    'TOKEN="unclosed\nSYNTHETIC_BODY_SECRET=hidden',
  ]) {
    const cwd = fixture(t, "TOKEN=", environment);
    for (const flags of [[], ["--json"]]) {
      const result = run(cwd, ["check", ...flags]);
      assert.equal(result.status, 1);
      assert.equal(result.stderr, "");
      assert.ok(!result.stdout.includes("RAW_SYNTHETIC_SECRET"));
      assert.ok(!result.stdout.includes("SYNTHETIC_BODY_SECRET"));
      if (flags.length) {
        const report = JSON.parse(result.stdout);
        assert.equal(report.comparison, "skipped");
        assert.equal(report.summary.missingKeys, null);
        assert.ok(report.summary.errors > 0);
      } else assert.match(result.stdout, /Comparison: skipped/);
    }
  }
});

test("configuration and project instructions are never executed and source bytes stay unchanged", (t) => {
  const cwd = fixture(t);
  const marker = join(cwd, "unexpected-execution");
  const template = "TOKEN=\nPASSWORD=\nURL=\nEXEC=";
  const environment = `TOKEN=SYNTHETIC_API_TOKEN\nPASSWORD='SYNTHETIC_PASSWORD'\nURL=postgres://synthetic:password@host/db\nEXEC=$(touch "${marker}")`;
  writeFileSync(join(cwd, ".env.example"), template);
  writeFileSync(join(cwd, ".env"), environment);
  writeFileSync(
    join(cwd, "configpilot.config.js"),
    'throw new Error("SYNTHETIC_PROJECT_CODE");',
  );
  writeFileSync(
    join(cwd, "package.json"),
    JSON.stringify({ scripts: { pretest: `touch "${marker}"` } }),
  );
  for (const flags of [[], ["--json"]]) {
    const result = run(cwd, ["check", ...flags], {
      TOKEN: "SYNTHETIC_EXTERNAL_TOKEN",
    });
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    for (const secret of [
      "SYNTHETIC_API_TOKEN",
      "SYNTHETIC_PASSWORD",
      "postgres://synthetic:password@host/db",
      "SYNTHETIC_EXTERNAL_TOKEN",
      "SYNTHETIC_PROJECT_CODE",
    ])
      assert.ok(!result.stdout.includes(secret));
    assert.equal(readFileSync(join(cwd, ".env"), "utf8"), environment);
    assert.equal(readFileSync(join(cwd, ".env.example"), "utf8"), template);
    assert.equal(existsSync(marker), false);
  }
});

test("directories and invalid UTF-8 fail safely before analysis", (t) => {
  const cwd = fixture(t);
  mkdirSync(join(cwd, "input directory"));
  let result = run(cwd, ["check", "--env=input directory", "--json"]);
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).error.code, "NOT_REGULAR_FILE");
  writeFileSync(
    join(cwd, ".env"),
    Buffer.concat([
      Buffer.from("TOKEN=SYNTHETIC_ENCODING_SECRET"),
      Buffer.from([0xff]),
    ]),
  );
  result = run(cwd, ["check", "--json"]);
  assert.equal(result.status, 2);
  assert.equal(result.stderr, "");
  assert.equal(JSON.parse(result.stdout).error.code, "INVALID_ENCODING");
  assert.ok(!result.stdout.includes("SYNTHETIC_ENCODING_SECRET"));
});

test("the 1 MiB byte limit is inclusive and applies before reading oversized files", (t) => {
  const cwd = fixture(t, "", "#".padEnd(1_048_576, "x"));
  assert.equal(run(cwd).status, 0);
  writeFileSync(join(cwd, ".env"), "#".padEnd(1_048_577, "x"));
  const result = run(cwd, ["check", "--json"]);
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).error.code, "FILE_TOO_LARGE");
});

test("UTF-8 BOM and CRLF inputs retain correct source line locations", (t) => {
  const cwd = fixture(
    t,
    "\uFEFFPORT=3000\r\nDATABASE_URL=",
    "PORT=4000\r\nREDIS_URL=example",
  );
  const result = run(cwd, ["check", "--json"]);
  assert.equal(result.status, 1);
  assert.deepEqual(
    JSON.parse(result.stdout).issues.map(({ location }) => location.line),
    [2, 2],
  );
});

test("regular-file symlinks are allowed while symlinks to directories are rejected", (t) => {
  const cwd = fixture(t);
  try {
    symlinkSync(join(cwd, ".env"), join(cwd, "selected.env"), "file");
  } catch (error) {
    if (process.platform === "win32" && error.code === "EPERM") {
      t.skip("Windows symlink creation requires additional privileges.");
      return;
    }
    throw error;
  }
  assert.equal(run(cwd, ["check", "--env=selected.env"]).status, 0);
  mkdirSync(join(cwd, "folder"));
  symlinkSync(
    join(cwd, "folder"),
    join(cwd, "selected-folder"),
    process.platform === "win32" ? "junction" : "dir",
  );
  const result = run(cwd, ["check", "--env=selected-folder", "--json"]);
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).error.code, "NOT_REGULAR_FILE");
});

test(
  "permission failures remain safe operational errors",
  { skip: process.platform === "win32" || process.getuid?.() === 0 },
  (t) => {
    const cwd = fixture(t);
    chmodSync(join(cwd, ".env"), 0o000);
    try {
      const result = run(cwd, ["check", "--json"]);
      assert.equal(result.status, 2);
      assert.equal(JSON.parse(result.stdout).error.code, "FILE_NOT_READABLE");
    } finally {
      chmodSync(join(cwd, ".env"), 0o600);
    }
  },
);

test(
  "FIFOs and devices are rejected without waiting for a writer",
  { skip: process.platform === "win32" },
  (t) => {
    const cwd = fixture(t);
    const fifo = join(cwd, "input.pipe");
    const created = spawnSync("mkfifo", [fifo], {
      encoding: "utf8",
      timeout: 5000,
    });
    assert.ifError(created.error);
    assert.equal(created.status, 0);
    for (const path of [fifo, "/dev/null"]) {
      const result = run(cwd, ["check", `--env=${path}`, "--json"]);
      assert.equal(result.status, 2);
      assert.equal(JSON.parse(result.stdout).error.code, "NOT_REGULAR_FILE");
    }
  },
);

test("output is deterministic plain text with NO_COLOR and redirected streams", (t) => {
  const cwd = fixture(t, "A=", "B=example");
  const first = run(cwd, ["check"], { NO_COLOR: "1" });
  const second = run(cwd, ["check"], { FORCE_COLOR: "1" });
  assert.equal(first.stdout, second.stdout);
  assert.equal(first.stderr, "");
  assert.ok(!first.stdout.includes("\u001b"));
});

test("a closed output pipe does not produce a stack trace", async (t) => {
  const cwd = fixture(t);
  const child = spawn(process.execPath, [cli, "--help"], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10_000,
  });
  t.after(() => {
    if (child.exitCode === null) child.kill();
  });
  let stderr = "";
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    stderr += chunk;
  });
  const closed = once(child, "close");
  child.stdout.destroy();
  const [status] = await closed;
  assert.equal(status, 0);
  assert.equal(stderr, "");
});
