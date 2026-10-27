import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
import { runCli } from "../../src/cli.js";
import {
  analyzeConfig,
  analyzeConfigWithRules,
  scanProject,
  previewTemplateUpdates,
} from "../../src/index.js";
import { normalizeRules, isIgnored } from "../../src/project/rules.js";
import { formatGithub } from "../../src/reporters/github.js";
const cli = fileURLToPath(new URL("../../bin/configpilot.js", import.meta.url));
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "configpilot project é "));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
async function config(root, value) {
  await writeFile(
    join(root, "configpilot.config.json"),
    JSON.stringify({ schemaVersion: 1, ...value }),
  );
}
const call = (cwd, args, extra = {}) =>
  runCli(args, { cwd, version: "1.2.0", ...extra });
const report = (r) => JSON.parse(r.stdout);

test("project rules preserve default analysis, inspect blank required keys without retaining values, and never downgrade syntax errors", () => {
  const input = {
    template: "API_KEY=\nOPTIONAL=\nEXTERNAL=\n",
    environment: 'API_KEY="  "\nTOKEN=SYNTHETIC_PRIVATE_VALUE',
  };
  const before = analyzeConfig(input),
    rules = {
      requiredKeys: ["API_KEY"],
      optionalKeys: ["OPTIONAL"],
      externalKeys: ["EXTERNAL"],
      severity: { UNDOCUMENTED_KEY: "off" },
    };
  const result = analyzeConfigWithRules(input, rules);
  assert.deepEqual(result.analysis, before);
  assert.equal(result.failed, true);
  assert.equal(result.summary.errors, 1);
  assert.equal(result.summary.warnings, 0);
  assert.equal(
    result.issues.find((i) => i.code === "EMPTY_REQUIRED_KEY").location.line,
    1,
  );
  assert.ok(!JSON.stringify(result).includes("SYNTHETIC_PRIVATE_VALUE"));
  for (const value of ["", " ", "\t", "# comment", '""', "''", "`  `"])
    assert.equal(
      analyzeConfigWithRules(
        { template: "KEY=", environment: `KEY=${value}` },
        { requiredKeys: ["KEY"] },
      ).failed,
      true,
      value,
    );
  for (const value of ["0", "false", '"#"', '"\\n"'])
    assert.equal(
      analyzeConfigWithRules(
        { template: "KEY=", environment: `KEY=${value}` },
        { requiredKeys: ["KEY"] },
      ).failed,
      false,
      value,
    );
  assert.equal(
    analyzeConfigWithRules(
      { template: "KEY=", environment: "KEY=\nKEY=provided" },
      { requiredKeys: ["KEY"] },
    ).failed,
    true,
  ); // duplicate warning
  assert.equal(
    analyzeConfigWithRules(
      { template: "KEY=", environment: "KEY=provided\nKEY=" },
      { requiredKeys: ["KEY"] },
    ).issues.some((i) => i.code === "EMPTY_REQUIRED_KEY"),
    true,
  );
  const malformed = analyzeConfigWithRules(
    {
      template: "KEY=",
      environment: 'KEY="SYNTHETIC_START\nSYNTHETIC_BODY=value\n"',
    },
    { requiredKeys: ["SYNTHETIC_BODY"], failOn: "never" },
  );
  assert.equal(malformed.failed, true);
  assert.ok(!malformed.issues.some((i) => i.code === "REQUIRED_KEY"));
  assert.ok(!JSON.stringify(malformed).includes("SYNTHETIC_START"));
  assert.throws(
    () => normalizeRules({ severity: { INVALID_DECLARATION: "off" } }),
    { code: "PROJECT_CONFIG_INVALID" },
  );
});

test("bounded path globs match directories and files without regex interpretation", () => {
  for (const path of ["test", "test/a.js", "src/test/a.js"])
    assert.equal(isIgnored(path, ["**/test/**"]), true, path);
  for (const path of ["a.test.js", "src/a.test.ts"])
    assert.equal(isIgnored(path, ["**/*.test.*"]), true, path);
  assert.equal(
    isIgnored("src/latest.js", ["**/test/**", "**/*.test.*"]),
    false,
  );
  assert.equal(isIgnored("src/[a].js", ["src/[a].js"]), true);
  assert.deepEqual(normalizeRules({ ignore: ["./generated/**"] }).ignore, [
    "generated/**",
  ]);
  assert.throws(() => normalizeRules({ ignore: ["./."] }));
  assert.throws(() => normalizeRules({ ignore: ["!src/**"] }));
  assert.equal(isIgnored("abc", ["a*bc"]), true);
  assert.equal(isIgnored("ab", ["a*b"]), true);
  assert.equal(isIgnored("a", ["a*a"]), false);
  assert.throws(() =>
    normalizeRules({ requiredKeys: ["A"], externalKeys: ["A"] }),
  );
  assert.throws(() => normalizeRules({ ignore: Array(33).fill("x") }));
});

test("explicit policies enforce source CI findings and ignored scopes; no config is loaded implicitly", async (t) => {
  const root = await fixture(t);
  await writeFile(
    join(root, "app.js"),
    "process.env.API_KEY; process.env.OPTIONAL; process.env.EXTERNAL",
  );
  await writeFile(join(root, ".env.example"), "OPTIONAL=\nEXTERNAL=");
  await writeFile(join(root, ".env"), "UNRELATED=SYNTHETIC_CONFIG_SECRET");
  await mkdir(join(root, "generated"));
  await writeFile(
    join(root, "generated", "bad.js"),
    "not valid source @ SYNTHETIC_BROKEN_SECRET",
  );
  await config(root, {
    rules: {
      ignore: ["generated/**"],
      requiredKeys: ["API_KEY"],
      optionalKeys: ["OPTIONAL"],
      externalKeys: ["EXTERNAL"],
      severity: { SOURCE_UNDOCUMENTED_KEY: "error" },
    },
  });
  const raw = await call(root, ["scan", "--json"]);
  assert.equal(raw.exitCode, 1); // ignored rules are opt-in
  const result = await call(root, [
    "scan",
    "--config",
    "configpilot.config.json",
    "--json",
  ]);
  const r = report(result);
  assert.equal(result.exitCode, 1);
  assert.equal(r.complete, true);
  assert.equal(r.filesScanned, 1);
  assert.equal(r.policy.failed, true);
  assert.equal(
    r.variables.find((v) => v.name === "EXTERNAL").configurationRole,
    "external",
  );
  assert.equal(
    r.issues
      .filter(
        (i) =>
          i.code === "SOURCE_MISSING_LOCAL_KEY" &&
          ["OPTIONAL", "EXTERNAL"].includes(i.name),
      )
      .every((i) => i.severity === "info"),
    true,
  );
  assert.ok(!result.stdout.includes("SYNTHETIC_"));
  const check = await call(root, [
    "check",
    "--config",
    "configpilot.config.json",
    "--json",
  ]);
  assert.equal(report(check).kind, "policy-check");
  const legacy = await call(root, ["check", "--json"]);
  assert.equal(report(legacy).kind, undefined);
});

test("unsafe/malformed JSON policy is rejected without execution or raw errors", async (t) => {
  const root = await fixture(t);
  for (const text of [
    "{broken SYNTHETIC_CONFIG_SECRET",
    '{"schemaVersion":2}',
    '{"schemaVersion":1,"unknown":"SYNTHETIC_CONFIG_SECRET"}',
    '{"schemaVersion":1,"rules":{"requiredKeys":["BAD=SECRET"]}}',
    JSON.stringify({ schemaVersion: 1, rules: { ignore: ["../outside"] } }),
    " ".repeat(65537),
  ]) {
    await writeFile(join(root, "configpilot.config.json"), text);
    const r = await call(root, [
      "scan",
      "--config",
      "configpilot.config.json",
      "--json",
    ]);
    assert.equal(r.exitCode, 2);
    assert.equal(report(r).error.code, "PROJECT_CONFIG_INVALID");
    assert.ok(!r.stdout.includes("SYNTHETIC_"));
  }
  await writeFile(
    join(root, "configpilot.config.js"),
    'throw new Error("EXECUTED")',
  );
  assert.equal(
    (await call(root, ["scan", "--config", "configpilot.config.js", "--json"]))
      .exitCode,
    2,
  );
  for (const args of [
    ["scan", "--config"],
    ["scan", "--config=x", "--config=y"],
    ["scan", "--workspace", "x"],
    ["init", "--workspaces", "--config", "x.json"],
    ["scan", "--github", "--json"],
    ["init", "--github"],
    ["scan", "--unknown", "--config", "x.json"],
  ])
    assert.equal((await call(root, args)).exitCode, 2);
  if (process.platform !== "win32") {
    const other = await fixture(t);
    await config(other, {});
    await symlink(
      join(other, "configpilot.config.json"),
      join(root, "linked.json"),
    );
    assert.equal(
      (await call(root, ["scan", "--config", "linked.json", "--json"]))
        .exitCode,
      2,
    );
  }
});

test("template additions are empty, sorted, deduplicated and read-only, including explicit required keys not in source", async (t) => {
  const root = await fixture(t);
  await writeFile(
    join(root, "app.js"),
    'process.env.Z_SECRET || "SYNTHETIC_SOURCE_CREDENTIAL"; process.env.A; process.env.A;',
  );
  await writeFile(
    join(root, ".env.example"),
    "A=SYNTHETIC_TEMPLATE_VALUE\nEXTRA_REQUIRED=",
  );
  await config(root, { rules: { requiredKeys: ["EXTRA_REQUIRED"] } });
  const before = await readFile(join(root, ".env.example"));
  const r = await call(root, [
    "scan",
    "--config",
    "configpilot.config.json",
    "--template-diff",
    "--json",
  ]);
  assert.equal(r.exitCode, 1); // explicit missing required local key
  assert.deepEqual(report(r).keys, ["Z_SECRET"]);
  assert.match(report(r).content, /Z_SECRET=\n/);
  assert.ok(!r.stdout.includes("SYNTHETIC_"));
  assert.deepEqual(await readFile(join(root, ".env.example")), before);
  await assert.rejects(readFile(join(root, ".env")), { code: "ENOENT" });
  const plain = await call(root, ["scan", "--template-diff"]);
  assert.match(plain.stdout, /READ ONLY/);
  assert.throws(() =>
    previewTemplateUpdates({ complete: false, variables: [] }),
  );
});

test("workspaces isolate source/config and only explicit single-workspace init can write", async (t) => {
  const root = await fixture(t);
  for (const [name, key] of [
    ["web", "VITE_API_URL"],
    ["api", "DATABASE_URL"],
  ]) {
    await mkdir(join(root, name));
    await writeFile(join(root, name, "app.ts"), `process.env.${key}`);
    await writeFile(join(root, name, ".env.example"), `${key}=`);
    await writeFile(
      join(root, name, ".env"),
      `${key}=SYNTHETIC_WORKSPACE_VALUE`,
    );
  }
  await config(root, {
    workspaces: [
      { name: "web", root: "web" },
      { name: "api", root: "api" },
    ],
  });
  const scanned = await call(root, [
    "scan",
    "--config",
    "configpilot.config.json",
    "--workspaces",
    "--json",
  ]);
  assert.equal(scanned.exitCode, 0);
  const ws = report(scanned).workspaces;
  assert.deepEqual(
    ws.map((w) => w.name),
    ["api", "web"],
  );
  assert.deepEqual(
    ws[0].report.variables.map((v) => v.name),
    ["DATABASE_URL"],
  );
  assert.deepEqual(
    ws[1].report.variables.map((v) => v.name),
    ["VITE_API_URL"],
  );
  assert.ok(!scanned.stdout.includes("SYNTHETIC_"));
  const checked = await call(root, [
    "check",
    "--config",
    "configpilot.config.json",
    "--workspaces",
    "--json",
  ]);
  assert.equal(checked.exitCode, 0);
  assert.equal(report(checked).kind, "workspaces");
  const terminal = await call(root, [
    "scan",
    "--config",
    "configpilot.config.json",
    "--workspaces",
  ]);
  assert.match(terminal.stdout, /Independent configuration/);
  assert.equal(
    (
      await call(root, [
        "init",
        "--config",
        "configpilot.config.json",
        "--workspaces",
        "--yes",
      ])
    ).exitCode,
    2,
  );
  await mkdir(join(root, "fresh 設定 space"));
  await writeFile(
    join(root, "fresh 設定 space", "app.js"),
    "process.env.FRESH",
  );
  await config(root, {
    workspaces: [{ name: "fresh", root: "fresh 設定 space" }],
  });
  const created = await call(root, [
    "init",
    "--config",
    "configpilot.config.json",
    "--workspace",
    "fresh",
    "--yes",
    "--json",
  ]);
  assert.equal(created.exitCode, 0);
  assert.match(
    await readFile(join(root, "fresh 設定 space", ".env"), "utf8"),
    /FRESH=/,
  );
  await assert.rejects(readFile(join(root, ".env")), { code: "ENOENT" });
});

test("workspace roots/inputs cannot escape, overlap, or traverse directory links", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, "a"));
  for (const workspaces of [
    [{ name: "a", root: "../outside" }],
    [
      { name: "a", root: "a" },
      { name: "b", root: "a/sub" },
    ],
    [
      { name: "a", root: "a" },
      { name: "a", root: "other" },
    ],
    [{ name: "a", root: "a", rules: null }],
  ]) {
    await config(root, { workspaces });
    assert.equal(
      (
        await call(root, [
          "scan",
          "--config",
          "configpilot.config.json",
          "--workspaces",
          "--json",
        ])
      ).exitCode,
      2,
    );
  }
  if (process.platform !== "win32") {
    const other = await fixture(t);
    await writeFile(join(other, "app.js"), "process.env.OUTSIDE_PRIVATE");
    await symlink(other, join(root, "linked"));
    await config(root, { workspaces: [{ name: "link", root: "linked" }] });
    const r = await call(root, [
      "scan",
      "--config",
      "configpilot.config.json",
      "--workspaces",
      "--json",
    ]);
    assert.equal(r.exitCode, 2);
    assert.ok(!r.stdout.includes("OUTSIDE_PRIVATE"));
  }
});

test("Vue JS/TS/JSX/TSX script blocks preserve original locations and privacy; template scopes remain explicit", async (t) => {
  const root = await fixture(t);
  for (const [extension, source] of [
    ["js", "process.env.API_KEY"],
    ["ts", "const a: string = process.env.API_KEY!"],
    ["jsx", "const el=<b>{process.env.API_KEY}</b>"],
    ["tsx", "const el: unknown=<b>{process.env.API_KEY}</b>"],
  ]) {
    await writeFile(
      join(root, "App.vue"),
      `<template>{{ process.env.HIDDEN_TEMPLATE }}</template>\n<script setup lang="${extension}">\n// process.env.COMMENT\n${source}; const s="process.env.STRING_SECRET";\n</script>`,
    );
    const r = await scanProject({ root });
    assert.equal(r.complete, true);
    assert.deepEqual(
      r.variables.map((v) => v.name),
      ["API_KEY"],
    );
    assert.equal(r.variables[0].references[0].location.line, 4);
    assert.equal(r.variables[0].references[0].location.file, "App.vue");
    assert.ok(r.issues.some((i) => i.code === "SOURCE_DYNAMIC_REFERENCE"));
  }
  await writeFile(
    join(root, "App.vue"),
    "<script>const process={env:{}}; process.env.SHADOW</script><template>constant</template>",
  );
  assert.equal((await scanProject({ root })).variables.length, 0);
  for (const source of [
    '<script src="./external.js"></script>',
    '<script lang="coffee">secret</script>',
    "<script>process.env.A</script><script setup>process.env.B</script>",
    '<template lang="pug">secret</template>',
    '<script>const s="SYNTHETIC_MALFORMED_SECRET</script>',
  ]) {
    await writeFile(join(root, "App.vue"), source);
    const r = await scanProject({ root });
    assert.equal(r.complete, false);
    assert.ok(!JSON.stringify(r).includes("SYNTHETIC_MALFORMED_SECRET"));
    assert.equal((await call(root, ["init", "--yes"])).exitCode, 2);
  }
});

test("GitHub annotations escape commands/paths, cap output, preserve exits and never include messages or source values", async (t) => {
  const rendered = formatGithub({
    issues: [
      {
        code: "INVALID_DECLARATION",
        severity: "error",
        message: "SYNTHETIC_VALUE\n::error::INJECTED",
        location: { file: "src/a,%\n::error::.js", line: 3 },
      },
      {
        code: "MISSING_KEY",
        key: "TOKEN",
        severity: "warning",
        location: { file: "src/a,%x.js", line: 4 },
      },
    ],
  });
  assert.ok(!rendered.includes("SYNTHETIC_VALUE"));
  assert.equal(rendered.trim().split("\n").length, 2);
  assert.match(rendered, /%2C%25x/);
  assert.equal(
    formatGithub({
      issues: Array(1000).fill({
        code: "MISSING_KEY",
        key: "TOKEN",
        severity: "warning",
      }),
    })
      .trim()
      .split("\n").length,
    201,
  );
  const root = await fixture(t);
  await writeFile(join(root, ".env.example"), "TOKEN=");
  await writeFile(join(root, ".env"), "OTHER=SYNTHETIC_GITHUB_VALUE");
  const r = await call(root, ["check", "--github"]);
  assert.equal(r.exitCode, 1);
  assert.match(r.stdout, /^::warning /);
  assert.ok(!r.stdout.includes("SYNTHETIC_GITHUB_VALUE"));
  assert.equal(r.stderr, "");
  const actual = spawnSync(process.execPath, [cli, "check", "--github"], {
    cwd: root,
    encoding: "utf8",
    timeout: 10000,
  });
  assert.equal(actual.status, 1);
  assert.equal(actual.stdout, r.stdout);
});

test("policy validation rejects null fields and preview output obeys its byte budget", () => {
  for (const field of [
    "requiredKeys",
    "optionalKeys",
    "externalKeys",
    "severity",
    "ignore",
    "failOn",
  ])
    assert.throws(() => normalizeRules({ [field]: null }), {
      code: "PROJECT_CONFIG_INVALID",
    });
  const variables = Array.from({ length: 4096 }, (_, i) => ({
    name: "A".repeat(120) + i,
    inTemplate: false,
  }));
  assert.throws(
    () => previewTemplateUpdates({ complete: true, variables }),
    RangeError,
  );
  const templateKeys = Array.from({ length: 300 }, (_, i) => "KEY_" + i);
  assert.deepEqual(
    previewTemplateUpdates(
      { complete: true, variables: [] },
      { templateKeys, requiredKeys: ["KEY_299"] },
    ).keys,
    [],
  );
});

test("workspaces share the total reference budget instead of multiplying it", async (t) => {
  const root = await fixture(t);
  for (const name of ["first", "second"]) {
    await mkdir(join(root, name));
    await writeFile(
      join(root, name, "app.js"),
      "process.env.KEY;".repeat(2100),
    );
  }
  await config(root, {
    workspaces: [
      { name: "first", root: "first" },
      { name: "second", root: "second" },
    ],
  });
  const r = await call(root, [
    "scan",
    "--config",
    "configpilot.config.json",
    "--workspaces",
    "--json",
  ]);
  assert.equal(r.exitCode, 2);
  const entries = report(r).workspaces;
  assert.equal(entries[0].report.complete, true);
  assert.equal(entries[1].report.error.code, "SCAN_LIMIT_EXCEEDED");
});

test("workspace GitHub locations are repo-relative and preview/init headers retain selected scope", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, "api"));
  await writeFile(join(root, "api", "app.js"), "process.env.TOKEN");
  await writeFile(join(root, "api", ".env.example"), "TOKEN=");
  await writeFile(join(root, "api", ".env"), "");
  await config(root, { workspaces: [{ name: "api", root: "api" }] });
  const r = await call(root, [
    "check",
    "--config",
    "configpilot.config.json",
    "--workspace",
    "api",
    "--github",
  ]);
  assert.equal(r.exitCode, 1);
  assert.match(r.stdout, /file=api\/.env.example/);
  assert.ok(!r.stdout.includes(root));
  const preview = await call(root, [
    "init",
    "--config",
    "configpilot.config.json",
    "--workspace",
    "api",
    "--dry-run",
  ]);
  assert.match(preview.stdout, /Root:/);
  assert.match(preview.stdout, /"api"/);
});

test("actual CLI never forwards Vue parser snippets or credentials through stdout/stderr", async (t) => {
  const root = await fixture(t);
  await writeFile(
    join(root, "Broken.vue"),
    '<template>{{ SYNTHETIC_TEMPLATE_CREDENTIAL + }}</template>\n<script>const secret="SYNTHETIC_SCRIPT_CREDENTIAL";</script>',
  );
  for (const flags of [["--json"], ["--verbose"], ["--no-color"]]) {
    const result = spawnSync(process.execPath, [cli, "scan", ...flags], {
      cwd: root,
      encoding: "utf8",
      timeout: 15000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.ok(!(result.stdout + result.stderr).includes("SYNTHETIC_"));
  }
});

test(
  "configured check rejects a file replaced by an outside symlink after path selection",
  { skip: process.platform === "win32" },
  async (t) => {
    const root = await fixture(t),
      outside = await fixture(t);
    await writeFile(join(root, ".env.example"), "TOKEN=");
    await writeFile(join(root, ".env"), "TOKEN=");
    await writeFile(
      join(outside, "private.env"),
      "OUTSIDE_PRIVATE_KEY=SYNTHETIC_OUTSIDE_SECRET",
    );
    await config(root, {});
    const { readConfigFile } =
      await import("../../src/utils/read-config-file.js");
    let replaced = false;
    const r = await call(
      root,
      ["check", "--config", "configpilot.config.json", "--json"],
      {
        readFile: async (path, options) => {
          if (path.endsWith("/.env") && !replaced) {
            replaced = true;
            await rm(path);
            await symlink(join(outside, "private.env"), path);
          }
          return readConfigFile(path, options);
        },
      },
    );
    assert.equal(replaced, true);
    assert.equal(r.exitCode, 2);
    assert.ok(!r.stdout.includes("OUTSIDE_PRIVATE_KEY"));
    assert.ok(!r.stdout.includes("SYNTHETIC_OUTSIDE_SECRET"));
  },
);
