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

test("public parser never executes input, changes the environment, writes files, or logs values", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "configpilot parser é "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const marker = join(directory, "unexpected-execution");
  const input = join(directory, ".env");
  const secrets = [
    "SYNTHETIC_PROCESS_TOKEN",
    "SYNTHETIC_PROCESS_PASSWORD",
    "SYNTHETIC_MULTILINE_BODY",
  ];
  const source = [
    `TOKEN=${secrets[0]}`,
    `PASSWORD="${secrets[1]}"`,
    `SHELL=$(touch "${marker}")`,
    "JAVASCRIPT=globalThis.__configpilotExecuted = true",
    "process.env.CONFIGPILOT_SIDE_EFFECT=changed",
    'CREDENTIAL="first',
    `${secrets[2]}=hidden`,
    '"',
    "TOKEN=other",
  ].join("\n");
  writeFileSync(input, source);
  const parser = new URL("../../src/index.js", import.meta.url).href;
  const script = `
import { parseDotenv } from ${JSON.stringify(parser)};
import { readFileSync } from "node:fs";
import process from "node:process";
const before = JSON.stringify(process.env);
const result = parseDotenv(readFileSync(0, "utf8"), { file: ".env" });
if (before !== JSON.stringify(process.env) || globalThis.__configpilotExecuted) {
  throw new Error("Parser executed input or changed the environment.");
}
process.stdout.write(JSON.stringify(result));
`;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    {
      cwd: directory,
      input: readFileSync(input),
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  assert.ifError(result.error);
  assert.equal(
    result.status,
    0,
    "Parser child process must exit successfully.",
  );
  assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout);
  assert.deepEqual(
    report.declarations.map(({ key }) => key),
    ["TOKEN", "PASSWORD", "SHELL", "JAVASCRIPT", "TOKEN"],
  );
  assert.deepEqual(
    report.issues.map(({ code }) => code),
    ["INVALID_DECLARATION", "UNSUPPORTED_MULTILINE", "DUPLICATE_KEY"],
  );
  for (const secret of secrets) {
    assert.ok(!(result.stdout + result.stderr).includes(secret));
  }
  assert.equal(readFileSync(input, "utf8"), source);
  assert.equal(existsSync(marker), false);
});
