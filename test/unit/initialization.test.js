import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, stat, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { generateEnvTemplate } from "../../src/initialization/template.js";
import {
  createEnvFile,
  inspectDestination,
} from "../../src/initialization/create.js";

test("generation deduplicates, orders and never copies source defaults or invents keys", () => {
  const report = {
    complete: true,
    variables: [
      {
        name: "JWT_SECRET",
        hasStaticFallback: true,
        value: "SYNTHETIC_HARDCODED_SECRET",
      },
      { name: "PORT" },
      { name: "PORT" },
      { name: "DEV", frameworkProvided: true },
    ],
  };
  const content = generateEnvTemplate(report);
  assert.ok(content.includes("JWT_SECRET=\n"));
  assert.equal(content.match(/PORT=3000/g).length, 1);
  assert.ok(!content.includes("NODE_ENV="));
  assert.ok(!content.includes("SYNTHETIC_HARDCODED_SECRET"));
  assert.equal(generateEnvTemplate({ complete: true, variables: [] }), "");
  assert.throws(() => generateEnvTemplate({ complete: false, variables: [] }));
});
test("creation requires consent, restrictive mode, exclusive creation and safe destination", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "configpilot init é "));
  t.after(() => rm(root, { recursive: true, force: true }));
  const request = { root, output: ".env", content: "PORT=3000\n" };
  await assert.rejects(createEnvFile(request), {
    code: "INIT_CONFIRMATION_REQUIRED",
  });
  const outcomes = await Promise.allSettled([
    createEnvFile({ ...request, confirmed: true }),
    createEnvFile({ ...request, confirmed: true }),
  ]);
  assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
  assert.equal(await readFile(join(root, ".env"), "utf8"), request.content);
  if (process.platform !== "win32")
    assert.equal((await stat(join(root, ".env"))).mode & 0o777, 0o600);
  await assert.rejects(createEnvFile({ ...request, confirmed: true }), {
    code: "INIT_EXISTS",
  });
  for (const output of [
    "../outside.env",
    "nested/file.env",
    "C:\\secret.env",
    ".gitignore",
    ".npmrc",
    "NUL",
    "COM1.env",
    "trailing.",
  ])
    await assert.rejects(
      createEnvFile({ ...request, output, confirmed: true }),
      { code: "INIT_OUTPUT_INVALID" },
    );
  if (process.platform !== "win32") {
    await symlink(join(root, "missing"), join(root, "link.env"));
    await assert.rejects(inspectDestination(root, "link.env"), {
      code: "INIT_EXISTS",
    });
  }
});

test("init CLI previews, requires confirmation, accepts/rejects consent and never overwrites", async (t) => {
  const { writeFile } = await import("node:fs/promises");
  const { runDiscoveryCli } = await import("../../src/discovery/cli.js");
  const root = await mkdtemp(join(tmpdir(), "configpilot workflow é "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "server.js"),
    'process.env.PORT ?? 9999; process.env.JWT_SECRET || "SYNTHETIC_SOURCE_SECRET"',
  );
  const run = (args, extra = {}) =>
    runDiscoveryCli(args, { cwd: root, ...extra });
  const preview = await run(["init", "--dry-run", "--json"]);
  assert.equal(preview.exitCode, 0);
  assert.equal(JSON.parse(preview.stdout).status, "preview");
  assert.ok(!preview.stdout.includes("SYNTHETIC_SOURCE_SECRET"));
  assert.equal((await run(["init"])).exitCode, 2);
  const cancelled = await run(["init"], {
    interactive: true,
    confirm: async () => false,
  });
  assert.match(cancelled.stdout, /Cancelled/);
  const accepted = await run(["init", "--template"], {
    interactive: true,
    confirm: async (preview) => {
      assert.ok(preview.includes("PORT=3000"));
      return true;
    },
  });
  assert.equal(accepted.exitCode, 0);
  assert.equal((await run(["init", "--yes"])).exitCode, 0);
  const before = await readFile(join(root, ".env"), "utf8");
  assert.equal((await run(["init", "--yes"])).exitCode, 2);
  assert.equal(await readFile(join(root, ".env"), "utf8"), before);
  const { runCli } = await import("../../src/cli.js");
  assert.equal(
    (await runCli(["check", "--json"], { cwd: root, version: "test" }))
      .exitCode,
    0,
  );
  const empty = await mkdtemp(join(tmpdir(), "configpilot empty "));
  t.after(() => rm(empty, { recursive: true, force: true }));
  assert.match(
    (await runDiscoveryCli(["init", "--yes"], { cwd: empty })).stdout,
    /No configurable variables/,
  );
});

test("Git ignore inspection recognizes ignored local files without modifying rules", async (t) => {
  const { writeFile } = await import("node:fs/promises");
  const { spawnSync } = await import("node:child_process");
  const { gitIgnoreStatus } =
    await import("../../src/initialization/create.js");
  const root = await mkdtemp(join(tmpdir(), "configpilot git "));
  t.after(() => rm(root, { recursive: true, force: true }));
  const hooks = join(root, "empty-hooks");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(hooks);
  const init = spawnSync("git", ["init", `--template=${hooks}`], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(init.status, 0);
  await writeFile(join(root, ".gitignore"), ".env\n.env.*.local\n");
  assert.equal(await gitIgnoreStatus(root, ".env"), "ignored");
  assert.equal(await gitIgnoreStatus(root, ".env.example"), "not-ignored");
  assert.equal(
    await readFile(join(root, ".gitignore"), "utf8"),
    ".env\n.env.*.local\n",
  );
});
