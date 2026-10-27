// Development-only schema oracles. No validator ships in the runtime package.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import Ajv from "ajv/dist/2020.js";
import { runCli } from "../src/cli.js";
import { analyzeConfigWithRules } from "../src/index.js";
const require = createRequire(import.meta.url);
const validator = new Ajv({ strict: true });
for (const path of [
  "schema.json",
  "discovery.schema.json",
  "initialization.schema.json",
  "project.schema.json",
  "config.schema.json",
])
  validator.addSchema(
    JSON.parse(readFileSync(require.resolve("configpilot/" + path), "utf8")),
  );
function accepts(kind, report) {
  const validate = validator.getSchema("urn:configpilot:" + kind + ":1");
  assert.equal(validate(report), true, JSON.stringify(validate.errors));
}

test("project schemas validate actual default/policy/initialization/preview/workspace/error reports", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "configpilot schemas é "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "app.js"), "process.env.API_KEY");
  await writeFile(join(root, ".env.example"), "API_KEY=");
  await writeFile(join(root, ".env"), "API_KEY=");
  await writeFile(
    join(root, "rules.json"),
    JSON.stringify({
      schemaVersion: 1,
      rules: { requiredKeys: ["API_KEY"] },
      workspaces: [{ name: "app", root: "." }],
    }),
  );
  const calls = [
    ["discovery", ["scan", "--json"]],
    ["discovery", ["scan", "--config", "rules.json", "--json"]],
    ["project", ["check", "--config", "rules.json", "--json"]],
    ["project", ["scan", "--template-diff", "--json"]],
    ["initialization", ["init", "--dry-run", "--json"]],
    ["project", ["scan", "--config", "rules.json", "--workspaces", "--json"]],
    ["project", ["check", "--config", "rules.json", "--workspaces", "--json"]],
    ["project", ["scan", "--config", "missing.json", "--json"]],
    ["discovery", ["scan", "--path", "..", "--json"]],
    ["initialization", ["init", "--yes", "--json"]],
  ];
  for (const [kind, args] of calls) {
    const r = await runCli(args, { cwd: root, version: "1.2.0" });
    accepts(kind, JSON.parse(r.stdout));
  }
  await mkdir(join(root, "fresh"));
  await writeFile(
    join(root, "fresh", "app.vue"),
    "<script setup>const port=process.env.PORT;</script>",
  );
  const init = await runCli(["init", "--yes", "--json"], {
    cwd: join(root, "fresh"),
    version: "1.2.0",
  });
  assert.equal(init.exitCode, 0);
  accepts("initialization", JSON.parse(init.stdout));
  await writeFile(
    join(root, ".env"),
    'API_KEY="SYNTHETIC_START\nSYNTHETIC_BODY=x\n"',
  );
  const malformed = await runCli(
    ["check", "--config", "rules.json", "--json"],
    { cwd: root, version: "1.2.0" },
  );
  accepts("project", JSON.parse(malformed.stdout));
});

test("schemas reject accidental values/snippets, malformed metadata and unsupported policy controls", () => {
  const policy = analyzeConfigWithRules(
    { template: "A=", environment: "A=" },
    { requiredKeys: ["A"] },
  );
  accepts("project", policy);
  const validate = validator.getSchema("urn:configpilot:project:1");
  for (const mutated of [
    { ...policy, value: "SYNTHETIC_SECRET" },
    {
      ...policy,
      issues: policy.issues.map((i) => ({
        ...i,
        sourceLine: "SYNTHETIC_SECRET",
      })),
    },
    { ...policy, schemaVersion: 2 },
    { ...policy, summary: { ...policy.summary, errors: -1 } },
  ])
    assert.equal(validate(mutated), false);
  const settings = validator.getSchema("urn:configpilot:config:1");
  assert.equal(
    settings({
      schemaVersion: 1,
      rules: { severity: { INVALID_DECLARATION: "off" } },
    }),
    false,
  );
  assert.equal(
    settings({
      schemaVersion: 1,
      rules: { defaultValues: { TOKEN: "SYNTHETIC_SECRET" } },
    }),
    false,
  );
  assert.equal(
    settings({ schemaVersion: 1, rules: { requiredKeys: ["A"] } }),
    true,
  );
});
