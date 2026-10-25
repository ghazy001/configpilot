import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { parseArguments, runCli } from "../../src/cli.js";
import { analyzeConfig } from "../../src/index.js";

test("path options accept split/equals forms, spaces, Unicode, Windows separators, and leading dashes", () => {
  assert.deepEqual(
    parseArguments([
      "check",
      "--template",
      "配置 folder/ref.env",
      "--env=C:\\my folder\\actual.env",
      "--json",
    ]),
    {
      command: "check",
      templatePath: "配置 folder/ref.env",
      environmentPath: "C:\\my folder\\actual.env",
      json: true,
    },
  );
  assert.equal(
    parseArguments(["check", "--env=-private.env"]).environmentPath,
    "-private.env",
  );
  assert.equal(
    parseArguments(["check", "--template=a=b.env"]).templatePath,
    "a=b.env",
  );
  assert.deepEqual(parseArguments(["check"]), {
    command: "check",
    templatePath: ".env.example",
    environmentPath: ".env",
    json: false,
  });
});

for (const args of [
  ["check", "extra"],
  ["check", "--env"],
  ["check", "--template"],
  ["check", "--env="],
  ["check", "--template="],
  ["check", "--env", ""],
  ["check", "--env", "--json"],
  ["check", "--template", "-private"],
  ["check", "--env=a", "--env=b"],
  ["check", "--template", "a", "--template=b"],
  ["check", "--json", "--json"],
  ["check", "--json=true"],
  ["check", "--version"],
  ["check", "--help", "--json"],
  ["--help", "extra"],
  ["--version", "extra"],
  ["check", "--env=bad\0path"],
  ["check", "constructor=x"],
  ["check", "--", "file"],
]) {
  test(`invalid arguments fail before file access: ${JSON.stringify(args)}`, async () => {
    let reads = 0;
    const result = await runCli(args, {
      version: "0.1.0",
      readFile: async () => {
        reads += 1;
        return "";
      },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(reads, 0);
    const output = result.stdout || result.stderr;
    assert.ok(output.includes("INVALID_ARGUMENTS"));
    if (args[0] === "check" && args.includes("--json")) {
      assert.equal(result.stderr, "");
      assert.equal(JSON.parse(result.stdout).error.code, "INVALID_ARGUMENTS");
    } else assert.equal(result.stdout, "");
  });
}

test("JSON success is exactly report schema 1 and file labels remain caller-selected", async () => {
  const reads = [];
  const cwd = resolve("test work é");
  const input = { template: "A=x\nB=x", environment: "B=y\nC=y" };
  const result = await runCli(
    ["check", "--template=ref.env", "--env=actual.env", "--json"],
    {
      version: "0.1.0",
      cwd,
      readFile: async (path) => {
        reads.push(path);
        return path === resolve(cwd, "ref.env")
          ? input.template
          : input.environment;
      },
    },
  );
  assert.deepEqual(reads, [
    resolve(cwd, "ref.env"),
    resolve(cwd, "actual.env"),
  ]);
  assert.equal(result.exitCode, 1);
  assert.equal(result.stderr, "");
  assert.deepEqual(
    JSON.parse(result.stdout),
    analyzeConfig({
      ...input,
      templateFile: "ref.env",
      environmentFile: "actual.env",
    }),
  );
});

test("both warnings and syntax errors produce exit 1, and clean analysis exits 0", async () => {
  for (const [source, status] of [
    ["A=x", 0],
    ["B=x", 1],
    ["invalid", 1],
    ["A=x\nA=y", 1],
  ]) {
    let call = 0;
    const result = await runCli(["check", "--json"], {
      version: "0.1.0",
      readFile: async () => (call++ === 0 ? "A=x" : source),
    });
    assert.equal(result.exitCode, status);
    assert.equal(result.stderr, "");
    assert.ok(JSON.parse(result.stdout).summary);
  }
});

test("file-read failures report role and safe code without paths or native exception contents", async () => {
  for (const role of ["template", "environment"]) {
    for (const [native, expected] of [
      ["ENOENT", "FILE_NOT_FOUND"],
      ["ENOTDIR", "FILE_NOT_FOUND"],
      ["EACCES", "FILE_NOT_READABLE"],
      ["EPERM", "FILE_NOT_READABLE"],
      ["EISDIR", "NOT_REGULAR_FILE"],
      ["INVALID_ENCODING", "INVALID_ENCODING"],
      ["FILE_TOO_LARGE", "FILE_TOO_LARGE"],
      [undefined, "FILE_NOT_READABLE"],
    ]) {
      let call = 0;
      const result = await runCli(
        ["check", "--env=SYNTHETIC_PATH_SECRET", "--json"],
        {
          version: "0.1.0",
          readFile: async () => {
            call += 1;
            if ((role === "template" && call === 1) || call === 2)
              throw Object.assign(new Error("SYNTHETIC_NATIVE_SECRET"), {
                code: native,
              });
            return "A=x";
          },
        },
      );
      assert.equal(result.exitCode, 2);
      assert.equal(result.stderr, "");
      assert.equal(JSON.parse(result.stdout).error.code, expected);
      assert.equal(JSON.parse(result.stdout).error.source, role);
      assert.ok(!result.stdout.includes("SYNTHETIC_PATH_SECRET"));
      assert.ok(!result.stdout.includes("SYNTHETIC_NATIVE_SECRET"));
    }
  }
});

test("unexpected failures get safe operational errors in either format", async () => {
  for (const flags of [[], ["--json"]]) {
    const result = await runCli(["check", ...flags], {
      version: "0.1.0",
      readFile: async () => ({ secret: "SYNTHETIC_FAILURE_SECRET" }),
    });
    assert.equal(result.exitCode, 2);
    const output = result.stdout || result.stderr;
    assert.ok(output.includes("INTERNAL_ERROR"));
    assert.ok(!output.includes("SYNTHETIC_FAILURE_SECRET"));
    assert.ok(!output.includes("at file:"));
  }
});
