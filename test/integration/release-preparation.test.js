import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

test("release preflight verifies exact-commit API results and redacts HTTP, JSON and network failures", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "configpilot preflight "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const preload = join(directory, "preload.mjs");
  writeFileSync(
    preload,
    `
    import assert from "node:assert/strict";
    import process from "node:process";
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.github.com/repos/ghazy001/configpilot/commits/" + "a".repeat(40) + "/check-runs?per_page=100&filter=latest&check_name=Quality%20gate");
      assert.equal(options.headers.Authorization, "Bearer SYNTHETIC_CI_TOKEN");
      assert.equal(options.redirect, "error");
      const scenario = process.env.CONFIGPILOT_TEST_SCENARIO;
      if (scenario === "network") throw new Error("SYNTHETIC_NATIVE_SECRET");
      return {
        ok: scenario !== "http",
        json: async () => {
          if (scenario === "json") throw new Error("SYNTHETIC_JSON_SECRET");
          return { check_runs: [{
            id: 1,
            name: "Quality gate", head_sha: (scenario === "stale" ? "b" : "a").repeat(40),
            app: { slug: "github-actions" }, status: "completed", conclusion: "success"
          }] };
        }
      };
    };
  `,
  );
  const script = fileURLToPath(
    new URL("../../scripts/check-release-quality.js", import.meta.url),
  );
  for (const scenario of ["success", "stale", "http", "json", "network"]) {
    const result = spawnSync(
      process.execPath,
      ["--import", pathToFileURL(preload).href, script],
      {
        env: {
          ...process.env,
          GITHUB_SHA: "a".repeat(40),
          GH_TOKEN: "SYNTHETIC_CI_TOKEN",
          CONFIGPILOT_TEST_SCENARIO: scenario,
        },
        encoding: "utf8",
        timeout: 5000,
      },
    );
    assert.ifError(result.error);
    assert.equal(result.status, scenario === "success" ? 0 : 1);
    assert.ok(!(result.stdout + result.stderr).includes("SYNTHETIC_"));
    if (scenario === "success") assert.equal(result.stderr, "");
    else {
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /successful Quality CI/);
    }
  }
});

test("release CI preflight fails safely before network access when metadata or token is missing", () => {
  const script = fileURLToPath(
    new URL("../../scripts/check-release-quality.js", import.meta.url),
  );
  for (const values of [
    { GITHUB_SHA: "a".repeat(40), GH_TOKEN: "" },
    { GITHUB_SHA: "invalid", GH_TOKEN: "SYNTHETIC_CI_TOKEN" },
  ]) {
    const result = spawnSync(process.execPath, [script], {
      env: { ...process.env, ...values },
      encoding: "utf8",
      timeout: 5000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /successful Quality CI/);
    assert.ok(!result.stderr.includes("SYNTHETIC_CI_TOKEN"));
  }
});

test("release rehearsal binds an offline private archive to a clean commit and rejects unsafe inputs", (t) => {
  const npm = process.env.npm_execpath;
  assert.ok(npm, "Run through npm test.");
  const directory = mkdtempSync(join(tmpdir(), "configpilot candidate é "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repo = join(directory, "repository");
  mkdirSync(repo);
  mkdirSync(join(repo, "scripts"));
  const original = fileURLToPath(new URL("../../scripts/", import.meta.url));
  for (const file of ["release-guards.js", "prepare-release.js"])
    copyFileSync(join(original, file), join(repo, "scripts", file));
  const metadata = {
    name: "configpilot",
    version: "0.1.0",
    private: true,
    type: "module",
    files: ["entry.js"],
  };
  writeFileSync(join(repo, "package.json"), JSON.stringify(metadata));
  writeFileSync(join(repo, "entry.js"), "export const example = true;\n");
  writeFileSync(join(repo, "README.md"), "# Synthetic release test\n");
  writeFileSync(join(repo, "LICENSE"), "Synthetic license fixture\n");
  writeFileSync(join(repo, ".gitignore"), ".env\n");
  writeFileSync(join(directory, "gitconfig"), "");
  mkdirSync(join(directory, "empty-template"));
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: join(directory, "gitconfig"),
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "ConfigPilot test",
    GIT_COMMITTER_NAME: "ConfigPilot test",
    GIT_AUTHOR_EMAIL: "test@example.invalid",
    GIT_COMMITTER_EMAIL: "test@example.invalid",
    npm_config_cache: join(directory, "cache"),
    npm_config_offline: "true",
    npm_config_registry: "http://127.0.0.1:9",
    npm_execpath: npm,
  };
  function git(args) {
    const result = spawnSync(
      "git",
      [
        "-c",
        "commit.gpgsign=false",
        "-c",
        `core.hooksPath=${join(directory, "empty-template")}`,
        ...args,
      ],
      { cwd: repo, env, encoding: "utf8", timeout: 10_000 },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  git(["init", `--template=${join(directory, "empty-template")}`]);
  git(["add", "."]);
  git(["commit", "-m", "Synthetic candidate fixture"]);
  const commit = git(["rev-parse", "HEAD"]);
  const secret = "TOKEN=SYNTHETIC_CANDIDATE_SECRET\n";
  writeFileSync(join(repo, ".env"), secret);
  function prepare(destination, expected) {
    const result = spawnSync(
      process.execPath,
      [join(repo, "scripts/prepare-release.js"), destination],
      { cwd: repo, env, encoding: "utf8", timeout: 30_000 },
    );
    assert.ifError(result.error);
    assert.equal(result.status, expected, result.stderr);
    assert.ok(
      !(result.stdout + result.stderr).includes("SYNTHETIC_CANDIDATE_SECRET"),
    );
    return result;
  }
  const destination = join(directory, "candidate");
  assert.equal(prepare(destination, 0).stderr, "");
  const candidate = JSON.parse(
    readFileSync(join(destination, "candidate.json"), "utf8"),
  );
  assert.equal(candidate.commit, commit);
  assert.equal(candidate.private, true);
  assert.deepEqual(candidate.files, [
    "LICENSE",
    "README.md",
    "entry.js",
    "package.json",
  ]);
  assert.equal(
    candidate.sha256,
    createHash("sha256")
      .update(readFileSync(join(destination, candidate.archive)))
      .digest("hex"),
  );
  prepare(destination, 1);
  assert.ok(
    existsSync(join(destination, "candidate.json")),
    "An existing candidate is never overwritten or removed.",
  );
  for (const path of [join(repo, "candidate"), join(repo, "..candidate")]) {
    prepare(path, 1);
    assert.equal(existsSync(path), false);
  }
  writeFileSync(join(repo, "entry.js"), "// dirty change\n");
  const dirty = join(directory, "dirty");
  prepare(dirty, 1);
  assert.equal(existsSync(dirty), false);
  git(["add", "."]);
  git(["commit", "-m", "Synthetic dirty change committed"]);
  writeFileSync(join(repo, ".gitignore"), ".env\nuntracked.js\n");
  writeFileSync(
    join(repo, "untracked.js"),
    "// ignored and not in the commit\n",
  );
  writeFileSync(
    join(repo, "package.json"),
    JSON.stringify({ ...metadata, files: ["untracked.js"] }),
  );
  git(["add", "."]);
  git(["commit", "-m", "Synthetic ignored allowlist entry"]);
  const untracked = join(directory, "untracked");
  prepare(untracked, 1);
  assert.equal(existsSync(untracked), false);
  writeFileSync(
    join(repo, "package.json"),
    JSON.stringify({ ...metadata, private: false }),
  );
  git(["add", "."]);
  git(["commit", "-m", "Synthetic private guard removal"]);
  const nonprivate = join(directory, "nonprivate");
  prepare(nonprivate, 1);
  assert.equal(existsSync(nonprivate), false);
  assert.equal(readFileSync(join(repo, ".env"), "utf8"), secret);
});
