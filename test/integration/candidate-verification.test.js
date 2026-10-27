import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import { candidateFiles } from "../../scripts/release-guards.js";

test("private candidate acceptance verifies installed workflows and rejects tampered identity or bytes", (t) => {
  const npm = process.env.npm_execpath;
  assert.ok(npm, "Run through npm test.");
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const metadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const directory = mkdtempSync(
    join(tmpdir(), "configpilot acceptance test é "),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repo = join(directory, "repository");
  mkdirSync(repo);
  for (const file of [
    ...candidateFiles(metadata),
    "scripts/verify-candidate.js",
    "scripts/offline-dependencies.js",
    "scripts/release-guards.js",
    "scripts/prepare-release.js",
  ]) {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    copyFileSync(join(root, file), join(repo, file));
  }
  writeFileSync(join(repo, ".gitignore"), "node_modules/\n");
  for (const name of [
    "@babel/parser",
    "@babel/types",
    "@babel/helper-string-parser",
    "@babel/helper-validator-identifier",
  ]) {
    mkdirSync(dirname(join(repo, "node_modules", name)), { recursive: true });
    cpSync(join(root, "node_modules", name), join(repo, "node_modules", name), {
      recursive: true,
    });
  }
  const hooks = join(directory, "empty-hooks");
  mkdirSync(hooks);
  const config = join(directory, "gitconfig");
  writeFileSync(config, "");
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: config,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "ConfigPilot test",
    GIT_COMMITTER_NAME: "ConfigPilot test",
    GIT_AUTHOR_EMAIL: "test@example.invalid",
    GIT_COMMITTER_EMAIL: "test@example.invalid",
    npm_execpath: npm,
    npm_config_cache: join(directory, "cache"),
    npm_config_offline: "true",
    npm_config_registry: "http://127.0.0.1:9",
  };
  function execute(command, args, expected = 0) {
    const result = spawnSync(command, args, {
      cwd: repo,
      env,
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    assert.equal(result.status, expected, result.stderr);
    return result;
  }
  function git(args) {
    return execute("git", [
      "-c",
      "commit.gpgsign=false",
      "-c",
      `core.hooksPath=${hooks}`,
      ...args,
    ]).stdout.trim();
  }
  git(["init", `--template=${hooks}`]);
  git(["add", "."]);
  git(["commit", "-m", "Synthetic acceptance fixture"]);
  const destination = join(directory, "candidate");
  execute(process.execPath, [
    join(repo, "scripts/prepare-release.js"),
    destination,
  ]);
  const manifestPath = join(destination, "candidate.json");
  const originalManifest = readFileSync(manifestPath);
  const manifest = JSON.parse(originalManifest);
  const archivePath = join(destination, manifest.archive);
  const originalArchive = readFileSync(archivePath);
  function verify(expected = 0, stage) {
    const result = execute(
      process.execPath,
      [join(repo, "scripts/verify-candidate.js"), destination],
      expected,
    );
    assert.ok(
      !(result.stdout + result.stderr).includes("SYNTHETIC_TAMPER_SECRET"),
    );
    if (expected) {
      assert.equal(result.stdout, "");
      assert.ok(result.stderr.includes(`(${stage})`), result.stderr);
    } else {
      assert.equal(result.stderr, "");
      const receipt = JSON.parse(result.stdout);
      assert.equal(receipt.verification, "passed");
      assert.equal(receipt.commit, manifest.commit);
      assert.equal(receipt.sha256, manifest.sha256);
      assert.equal(receipt.files, candidateFiles(metadata).length);
      assert.equal(receipt.platform, process.platform);
      assert.equal(receipt.node, process.version);
      assert.equal(receipt.publicationAuthorized, false);
      assert.ok(receipt.checks.includes("CLI workflows"));
    }
  }
  verify();
  assert.deepEqual(readFileSync(manifestPath), originalManifest);
  assert.deepEqual(readFileSync(archivePath), originalArchive);
  for (const [mutation, stage] of [
    [{ sha256: "0".repeat(64) }, "archive identity"],
    [{ npmIntegrity: "sha512-incorrect" }, "archive identity"],
    [{ commit: "b".repeat(40) }, "source identity"],
    [{ files: [...manifest.files, ".env"] }, "manifest"],
    [{ archive: "../SYNTHETIC_TAMPER_SECRET.tgz" }, "manifest"],
  ]) {
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, ...mutation }));
    verify(1, stage);
  }
  writeFileSync(manifestPath, originalManifest);
  const entry = join(repo, "src/index.js");
  const originalEntry = readFileSync(entry);
  writeFileSync(entry, "// SYNTHETIC_TAMPER_SECRET\n");
  verify(1, "source identity");

  // Give a changed archive matching digests but restore the reviewed source. It
  // must fail installed byte equality before executing any installed module.
  const changed = join(directory, "changed");
  mkdirSync(changed);
  execute(process.execPath, [
    npm,
    "pack",
    "--ignore-scripts",
    "--offline",
    "--pack-destination",
    changed,
  ]);
  writeFileSync(entry, originalEntry);
  const changedArchive = readFileSync(join(changed, manifest.archive));
  writeFileSync(archivePath, changedArchive);
  writeFileSync(
    manifestPath,
    JSON.stringify({
      ...manifest,
      sha256: createHash("sha256").update(changedArchive).digest("hex"),
      npmIntegrity:
        "sha512-" +
        createHash("sha512").update(changedArchive).digest("base64"),
    }),
  );
  verify(1, "installed contents");
  git(["update-index", "--assume-unchanged", "src/index.js"]);
  writeFileSync(entry, "// SYNTHETIC_TAMPER_SECRET\n");
  assert.equal(git(["diff", "--name-only"]), "");
  verify(1, "source identity");
  writeFileSync(entry, originalEntry);
  git(["update-index", "--no-assume-unchanged", "src/index.js"]);
  assert.equal(git(["status", "--porcelain"]), "");
});
