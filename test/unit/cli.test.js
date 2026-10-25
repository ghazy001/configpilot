import assert from "node:assert/strict";
import test from "node:test";
import { parseArguments, runCli } from "../../src/cli.js";

const options = { version: "0.1.0" };

test("help describes the available command, options, and exit codes", async () => {
  for (const args of [[], ["--help"], ["check", "--help"]]) {
    const result = await runCli(args, options);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, /Usage:/);
    assert.match(result.stdout, /configpilot --help/);
    assert.match(result.stdout, /configpilot --version/);
    assert.match(result.stdout, /--template PATH/);
    assert.match(result.stdout, /--env PATH/);
    assert.match(result.stdout, /--json/);
    assert.match(result.stdout, /Exit codes:/);
  }
});

test("version is provided by the caller and ends with a newline", async () => {
  assert.deepEqual(await runCli(["--version"], { version: "0.2.0" }), {
    exitCode: 0,
    stdout: "0.2.0\n",
    stderr: "",
  });
});

test("check analyzes the explicitly read configuration", async () => {
  const result = await runCli(["check"], {
    ...options,
    readFile: async () => "PORT=3000",
  });
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /No configuration issues found/);
});

test("unknown, mixed, and extra arguments fail without being echoed", async () => {
  const secret = "SYNTHETIC_TOKEN_DO_NOT_ECHO";
  for (const args of [
    [secret],
    ["--unknown", secret],
    ["--help", secret],
    ["--version", secret],
    ["--help", "--version"],
    ["check", "--env", secret, "extra"],
    [`--password=${secret}`],
    [`\u001b[31m${secret}\n`],
  ]) {
    const result = await runCli(args, options);
    assert.equal(result.exitCode, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /configpilot --help/);
    assert.ok(!JSON.stringify(result).includes(secret));
    assert.ok(!result.stderr.includes("\u001b"));
  }
});

test("argument resolution is deterministic and leaves inputs unchanged", () => {
  const args = Object.freeze(["check", "--json"]);
  assert.deepEqual(parseArguments(args), parseArguments(args));
});
