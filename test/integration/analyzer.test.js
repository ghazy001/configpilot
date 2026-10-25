import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { URL } from "node:url";

test("public analysis keeps success, syntax-error, and exception output value-free without side effects", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "configpilot analysis é "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const marker = join(directory, "unexpected-execution");
  const templatePath = join(directory, "reference.env");
  const environmentPath = join(directory, "actual.env");
  const template =
    "DATABASE_URL=SYNTHETIC_TEMPLATE_TOKEN\nPORT=3000\nSHELL=\nJAVASCRIPT=";
  const environment = [
    "PORT=SYNTHETIC_ENV_PASSWORD",
    "REDIS_URL=redis://synthetic:password@host/db",
    `SHELL=$(touch "${marker}")`,
    "JAVASCRIPT=globalThis.__configpilotExecuted = true",
  ].join("\n");
  writeFileSync(templatePath, template);
  writeFileSync(environmentPath, environment);
  const payload = {
    template: readFileSync(templatePath, "utf8"),
    environment: readFileSync(environmentPath, "utf8"),
    invalid:
      'CREDENTIAL="first\nSYNTHETIC_CREDENTIAL_BODY=hidden\n"\nSYNTHETIC_RAW_LINE',
  };
  const moduleUrl = new URL("../../src/index.js", import.meta.url).href;
  const script = `
import { analyzeConfig } from ${JSON.stringify(moduleUrl)};
import { readFileSync } from "node:fs";
import process from "node:process";
const input = JSON.parse(readFileSync(0, "utf8"));
const before = JSON.stringify(process.env);
const complete = analyzeConfig({ template: input.template, environment: input.environment });
const skipped = analyzeConfig({ template: input.invalid, environment: input.environment });
let exception;
try {
  analyzeConfig({ template: input.template, environment: { raw: input.environment } });
} catch (error) {
  exception = { name: error.name, message: error.message, stack: error.stack };
}
if (before !== JSON.stringify(process.env) || globalThis.__configpilotExecuted) {
  throw new Error("Analysis executed input or changed the environment.");
}
process.stdout.write(JSON.stringify({ complete, skipped, exception }));
`;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    {
      cwd: directory,
      env: { ...process.env, DATABASE_URL: "SYNTHETIC_EXTERNAL_TOKEN" },
      input: JSON.stringify(payload),
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  assert.ifError(result.error);
  assert.equal(
    result.status,
    0,
    "Analysis child process must complete successfully.",
  );
  assert.equal(result.stderr, "");
  const { complete, skipped, exception } = JSON.parse(result.stdout);
  assert.equal(complete.comparison, "complete");
  // Supplying a runtime variable does not silently change the explicit comparison.
  assert.deepEqual(
    complete.issues.map(({ code, key }) => [code, key]),
    [
      ["MISSING_KEY", "DATABASE_URL"],
      ["UNDOCUMENTED_KEY", "REDIS_URL"],
    ],
  );
  assert.equal(skipped.comparison, "skipped");
  assert.equal(skipped.summary.missingKeys, null);
  assert.equal(exception.name, "TypeError");
  assert.equal(exception.message, "environment must be a string.");
  for (const secret of [
    "SYNTHETIC_TEMPLATE_TOKEN",
    "SYNTHETIC_ENV_PASSWORD",
    "redis://synthetic:password@host/db",
    "SYNTHETIC_CREDENTIAL_BODY",
    "SYNTHETIC_RAW_LINE",
    "SYNTHETIC_EXTERNAL_TOKEN",
  ]) {
    assert.ok(!(result.stdout + result.stderr).includes(secret));
  }
  assert.equal(existsSync(marker), false);
  assert.equal(readFileSync(templatePath, "utf8"), template);
  assert.equal(readFileSync(environmentPath, "utf8"), environment);
});
