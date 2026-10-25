import assert from "node:assert/strict";
import test from "node:test";
import { runCli } from "../../src/cli.js";

const options = { version: "0.1.0" };

test("help describes only available commands and the current limitation", () => {
  for (const args of [[], ["--help"]]) {
    const result = runCli(args, options);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, /Usage:/);
    assert.match(result.stdout, /configpilot --help/);
    assert.match(result.stdout, /configpilot --version/);
    assert.match(result.stdout, /not implemented yet/);
  }
});

test("version is provided by the caller and ends with a newline", () => {
  assert.deepEqual(runCli(["--version"], { version: "0.2.0" }), {
    exitCode: 0,
    stdout: "0.2.0\n",
    stderr: "",
  });
});

test("check does not pretend to have analyzed configuration", () => {
  const result = runCli(["check"], options);
  assert.equal(result.exitCode, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /analysis is not implemented/);
});

test("unknown, mixed, and extra arguments fail without being echoed", () => {
  const secret = "SYNTHETIC_TOKEN_DO_NOT_ECHO";
  for (const args of [
    [secret],
    ["--unknown", secret],
    ["--help", secret],
    ["--version", secret],
    ["--help", "--version"],
    ["check", "--env", secret],
    [`--password=${secret}`],
    [`\u001b[31m${secret}\n`],
  ]) {
    const result = runCli(args, options);
    assert.equal(result.exitCode, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /configpilot --help/);
    assert.ok(!JSON.stringify(result).includes(secret));
    assert.ok(!result.stderr.includes("\u001b"));
  }
});

test("argument resolution is deterministic and leaves inputs unchanged", () => {
  const args = Object.freeze(["check", "--json"]);
  const metadata = Object.freeze({ version: "0.1.0" });
  assert.deepEqual(runCli(args, metadata), runCli(args, metadata));
});
