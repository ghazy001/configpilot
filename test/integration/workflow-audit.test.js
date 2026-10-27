import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, readFile, unlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { runDiscoveryCli } from "../../src/discovery/cli.js";
import { runCli } from "../../src/cli.js";
import { gitIgnoreStatus } from "../../src/initialization/create.js";
import { scanProject } from "../../src/discovery/project.js";
import { discoveryNextStep } from "../../src/reporters/discovery.js";
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "configpilot quality é "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "app.js"), "process.env.PORT");
  return root;
}
test("audit: init preserves template-only and local-only keys in the onboarding workflow", async (t) => {
  for (const role of ["template", "local"]) {
    const root = await fixture(t);
    await writeFile(
      join(root, role === "template" ? ".env.example" : ".env"),
      "EXTRA=SYNTHETIC_PRIVATE_VALUE\nPORT=\n",
    );
    const result = await runDiscoveryCli(
      ["init", ...(role === "local" ? ["--template"] : []), "--yes", "--json"],
      { cwd: root },
    );
    assert.equal(result.exitCode, 0);
    const content = JSON.parse(result.stdout).content;
    assert.match(content, /EXTRA=\n/);
    assert.ok(!content.includes("SYNTHETIC_PRIVATE_VALUE"));
    assert.equal(
      (await runCli(["check", "--json"], { cwd: root, version: "test" }))
        .exitCode,
      0,
    );
  }
});
test("audit: private .env warning cannot be bypassed by --template", async (t) => {
  const root = await fixture(t);
  const result = await runDiscoveryCli(
    ["init", "--template", "--output", ".env", "--dry-run", "--json"],
    { cwd: root },
  );
  assert.equal(result.exitCode, 0);
  const resultJson = JSON.parse(result.stdout);
  assert.notEqual(resultJson.ignore, "public-template");
  assert.ok(resultJson.warnings.length > 0);
});
test("audit: a tracked deleted env file is not considered safely ignored", async (t) => {
  const root = await fixture(t);
  const git = (args) =>
    spawnSync(
      "git",
      ["-c", "core.hooksPath=", "-c", "core.fsmonitor=false", ...args],
      { cwd: root, encoding: "utf8" },
    );
  assert.equal(git(["init"]).status, 0);
  await writeFile(join(root, ".env"), "KEY=SYNTHETIC_VALUE\n");
  assert.equal(git(["add", ".env"]).status, 0);
  await writeFile(join(root, ".gitignore"), ".env\n");
  await unlink(join(root, ".env"));
  assert.equal(await gitIgnoreStatus(root, ".env"), "not-ignored");
  assert.equal(await readFile(join(root, ".gitignore"), "utf8"), ".env\n");
});

test("audit: --template cannot classify arbitrary environment variants as public", async (t) => {
  const root = await fixture(t);
  for (const output of [".env.qa", ".env.preview", ".ENV.PRODUCTION"]) {
    const result = await runDiscoveryCli(
      ["init", "--template", "--output", output, "--dry-run", "--json"],
      { cwd: root },
    );
    assert.equal(result.exitCode, 0);
    const value = JSON.parse(result.stdout);
    assert.notEqual(value.ignore, "public-template");
    assert.ok(value.warnings.length);
  }
});

test("audit: .env.sample onboarding recommends creating the reference that default check reads", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, ".env.sample"), "PORT=\nSAMPLE_ONLY=\n");
  assert.equal(
    discoveryNextStep(await scanProject({ root }))[1],
    "configpilot init --template",
  );
  const local = await runDiscoveryCli(["init", "--yes"], { cwd: root });
  assert.equal(local.exitCode, 0);
  assert.match(local.stdout, /init --template/);
  assert.equal(
    (await runCli(["check"], { cwd: root, version: "test" })).exitCode,
    2,
  );
  assert.equal(
    (await runDiscoveryCli(["init", "--template", "--yes"], { cwd: root }))
      .exitCode,
    0,
  );
  assert.equal(
    (await runCli(["check"], { cwd: root, version: "test" })).exitCode,
    0,
  );
});

test("audit: custom configuration names lead to explicit check options without shell interpolation", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, ".env.example"), "PORT=\n");
  for (const [output, template] of [
    [".env.local", false],
    ["public-config.txt", true],
    [".env.sample", true],
  ]) {
    const result = await runDiscoveryCli(
      [
        "init",
        "--yes",
        "--output",
        output,
        ...(template ? ["--template"] : []),
      ],
      { cwd: root },
    );
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /check --help/);
    assert.match(result.stdout, template ? /--template/ : /--env/);
  }
  const selected = await scanProject({ root, environment: ".env.local" });
  assert.equal(discoveryNextStep(selected)[1], "configpilot check --help");
  const customTemplate = await scanProject({
    root,
    template: "public-config.txt",
  });
  assert.equal(
    discoveryNextStep(customTemplate)[1],
    "configpilot check --help",
  );
  const sampleWithDefault = await scanProject({
    root,
    template: ".env.sample",
  });
  assert.equal(
    discoveryNextStep(sampleWithDefault)[1],
    "configpilot check --help",
  );
  assert.equal(
    (
      await runCli(
        ["check", "--template", "public-config.txt", "--env", ".env.local"],
        { cwd: root, version: "test" },
      )
    ).exitCode,
    0,
  );
});
