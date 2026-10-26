// Maintainer-only, offline acceptance of an exact reviewed source/archive pair.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { candidateFiles } from "./release-guards.js";

const root = fileURLToPath(new URL("../", import.meta.url));
let directory;
let stage = "arguments";
try {
  assert.equal(process.argv.length, 3);
  assert.ok(process.env.npm_execpath);
  const selected = resolve(process.argv[2]);
  const manifestPath = join(selected, "candidate.json");
  stage = "manifest";
  assert.ok(lstatSync(manifestPath).isFile());
  assert.ok(lstatSync(manifestPath).size <= 65_536);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const metadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const expected = candidateFiles(metadata);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.name, metadata.name);
  assert.equal(manifest.version, metadata.version);
  assert.equal(manifest.private, metadata.private === true);
  assert.deepEqual(manifest.publishConfig, metadata.publishConfig);
  assert.deepEqual(manifest.files, expected);
  assert.match(manifest.commit, /^[a-f0-9]{40}$/);
  assert.match(manifest.archive, /^[A-Za-z0-9][A-Za-z0-9._+-]*\.tgz$/);
  assert.match(manifest.sha256, /^[a-f0-9]{64}$/);

  stage = "archive identity";
  const archivePath = join(selected, manifest.archive);
  assert.ok(lstatSync(archivePath).isFile());
  const archive = readFileSync(archivePath);
  assert.equal(
    createHash("sha256").update(archive).digest("hex"),
    manifest.sha256,
  );
  assert.equal(
    "sha512-" + createHash("sha512").update(archive).digest("base64"),
    manifest.npmIntegrity,
  );

  function execute(
    command,
    args,
    cwd,
    env = process.env,
    status = 0,
    encoding = "utf8",
  ) {
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding,
      timeout: 30_000,
      maxBuffer: 5 * 1024 * 1024,
      windowsVerbatimArguments: command === "cmd.exe",
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    assert.equal(result.status, status);
    return result;
  }

  stage = "source identity";
  const tracked = execute(
    "git",
    ["ls-tree", "-r", "--name-only", manifest.commit, "--", ...expected],
    root,
  );
  assert.deepEqual(tracked.stdout.trim().split("\n").sort(), expected);
  // Compare committed blobs directly: status/diff may hide working-tree changes
  // behind assume-unchanged or skip-worktree flags in the local index.
  for (const path of expected) {
    assert.ok(lstatSync(join(root, path)).isFile());
    const blob = execute(
      "git",
      ["show", `${manifest.commit}:${path}`],
      root,
      process.env,
      0,
      null,
    );
    assert.deepEqual(readFileSync(join(root, path)), blob.stdout);
  }

  directory = mkdtempSync(join(tmpdir(), "configpilot acceptance é "));
  const consumer = join(directory, "consumer");
  mkdirSync(consumer);
  writeFileSync(
    join(consumer, "package.json"),
    '{"private":true,"type":"module"}\n',
  );
  const env = {
    ...process.env,
    npm_config_cache: join(directory, "cache"),
    npm_config_registry: "http://127.0.0.1:9",
    npm_config_offline: "true",
  };
  stage = "offline installation";
  execute(
    process.execPath,
    [
      process.env.npm_execpath,
      "install",
      archivePath,
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
    ],
    consumer,
    env,
  );
  const installed = join(consumer, "node_modules", "configpilot");
  function files(path, prefix = "") {
    return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
      const relative = prefix + entry.name;
      if (entry.isDirectory())
        return files(join(path, entry.name), relative + "/");
      assert.ok(entry.isFile());
      return [relative];
    });
  }
  stage = "installed contents";
  assert.deepEqual(files(installed).sort(), expected);
  for (const path of expected)
    assert.deepEqual(
      readFileSync(join(installed, path)),
      readFileSync(join(root, path)),
    );
  const cli = join(installed, "bin", "configpilot.js");
  if (process.platform !== "win32") assert.ok(lstatSync(cli).mode & 0o111);

  stage = "public API";
  const smoke = join(consumer, "acceptance.mjs");
  writeFileSync(
    smoke,
    String.raw`
import assert from "node:assert/strict";
import * as api from "configpilot";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
assert.deepEqual(Object.keys(api).sort(), ["ISSUE_CODES", "analyzeConfig", "parseDotenv"]);
const schema = JSON.parse(readFileSync(createRequire(import.meta.url).resolve("configpilot/schema.json"), "utf8"));
assert.ok(schema.$defs.complete && schema.$defs.skipped && schema.$defs.operational);
const input = {template: "TOKEN=\nPORT=", environment: "PORT=3000\nEXTRA=SYNTHETIC_ACCEPTANCE_SECRET"};
const report = api.analyzeConfig(input);
assert.equal(report.comparison, "complete");
assert.equal(report.summary.missingKeys, 1);
assert.equal(report.summary.undocumentedKeys, 1);
assert.deepEqual(api.analyzeConfig(input), report);
assert.ok(!JSON.stringify(report).includes("SYNTHETIC_ACCEPTANCE_SECRET"));
const malformed = 'KEY=\u00a0"first\nSYNTHETIC_ACCEPTANCE_BODY=x\nSYNTHETIC_ACCEPTANCE_BODY=y\n"';
assert.ok(!JSON.stringify(api.parseDotenv(malformed)).includes("SYNTHETIC_ACCEPTANCE_BODY"));
assert.equal(api.analyzeConfig({template: "", environment: malformed}).comparison, "skipped");
assert.throws(() => api.parseDotenv("A=x\n".repeat(2049)), RangeError);
`,
  );
  execute(process.execPath, [smoke], consumer, env);
  writeFileSync(
    join(consumer, "dynamic.cjs"),
    'import("configpilot").then(({analyzeConfig}) => { if(analyzeConfig({template:"",environment:""}).summary.total !== 0) process.exitCode=1; }).catch(() => { process.exitCode=1; });\n',
  );
  execute(process.execPath, [join(consumer, "dynamic.cjs")], consumer, env);

  stage = "CLI workflows";
  function cliRun(args, status) {
    const result = execute(
      process.execPath,
      [cli, ...args],
      consumer,
      env,
      status,
    );
    assert.equal(result.stderr, "");
    assert.ok(!result.stdout.includes("SYNTHETIC_ACCEPTANCE_"));
    return result.stdout;
  }
  assert.equal(cliRun(["--version"], 0), metadata.version + "\n");
  assert.match(cliRun(["--help"], 0), /Usage:/);
  const template = "PORT=\nTOKEN=\n";
  const clean = "export PORT=3000\nTOKEN='SYNTHETIC_ACCEPTANCE_SECRET'\n";
  writeFileSync(join(consumer, ".env.example"), template);
  writeFileSync(join(consumer, ".env"), clean);
  assert.equal(JSON.parse(cliRun(["check", "--json"], 0)).summary.total, 0);
  const shim = join(
    consumer,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "configpilot.cmd" : "configpilot",
  );
  const shimResult =
    process.platform === "win32"
      ? execute(
          "cmd.exe",
          ["/d", "/s", "/c", `""${shim}" check --json"`],
          consumer,
          env,
        )
      : execute(shim, ["check", "--json"], consumer, env);
  assert.equal(shimResult.stderr, "");
  assert.equal(JSON.parse(shimResult.stdout).summary.total, 0);
  assert.equal(readFileSync(join(consumer, ".env"), "utf8"), clean);
  const mismatch = "PORT=3000\nEXTRA=SYNTHETIC_ACCEPTANCE_SECRET\n";
  writeFileSync(join(consumer, ".env"), mismatch);
  assert.equal(JSON.parse(cliRun(["check", "--json"], 1)).summary.warnings, 2);
  assert.match(cliRun(["check"], 1), /MISSING_KEY/);
  assert.equal(readFileSync(join(consumer, ".env"), "utf8"), mismatch);
  assert.equal(readFileSync(join(consumer, ".env.example"), "utf8"), template);
  assert.equal(
    JSON.parse(cliRun(["check", "--env=absent.env", "--json"], 2)).error.code,
    "FILE_NOT_FOUND",
  );
  const malformed =
    'KEY=\u00a0"first\nSYNTHETIC_ACCEPTANCE_BODY=x\nSYNTHETIC_ACCEPTANCE_BODY=y\n"';
  writeFileSync(join(consumer, ".env"), malformed);
  const skipped = JSON.parse(cliRun(["check", "--json"], 1));
  assert.equal(skipped.comparison, "skipped");
  assert.equal(skipped.summary.missingKeys, null);
  assert.equal(readFileSync(join(consumer, ".env"), "utf8"), malformed);
  writeFileSync(join(consumer, ".env"), "A=x\n".repeat(2049));
  assert.equal(
    JSON.parse(cliRun(["check", "--json"], 2)).error.code,
    "INPUT_LIMIT_EXCEEDED",
  );

  process.stdout.write(
    JSON.stringify({
      schemaVersion: 1,
      verification: "passed",
      commit: manifest.commit,
      name: metadata.name,
      version: metadata.version,
      sha256: manifest.sha256,
      files: expected.length,
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      checks: [
        "archive identity",
        "source identity",
        "offline installation",
        "installed contents",
        "public API",
        "CLI workflows",
      ],
      publicationAuthorized: false,
    }) + "\n",
  );
} catch {
  process.stderr.write(
    `Candidate verification failed (${stage}). Use the reviewed manifest/archive and matching source.\n`,
  );
  process.exitCode = 1;
} finally {
  if (directory) rmSync(directory, { recursive: true, force: true });
}
