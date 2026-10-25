import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

const cli = fileURLToPath(new URL("../../bin/configpilot.js", import.meta.url));
const metadata = new URL("../../package.json", import.meta.url).href;
const reader = new URL("../../src/utils/read-config-file.js", import.meta.url)
  .href;

function child(args) {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}

for (const failure of ["unreadable", "malformed"]) {
  test(`executable safely handles ${failure} package metadata in both output modes`, (t) => {
    const directory = mkdtempSync(join(tmpdir(), "configpilot fault é "));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    const preload = join(directory, "metadata.mjs");
    // Patch only the executable's explicit metadata read, in an isolated process.
    // Keep the real package intact so ESM loading can still succeed.
    writeFileSync(
      preload,
      `import fs from "node:fs";
       import { syncBuiltinESMExports } from "node:module";
       const original = fs.readFileSync;
       fs.readFileSync = function (path, ...args) {
         if (String(path) === ${JSON.stringify(metadata)}) {
           ${failure === "unreadable" ? 'throw new Error("SYNTHETIC_METADATA_SECRET");' : "return '{\"SYNTHETIC_METADATA_SECRET\":';"}
         }
         return original.call(this, path, ...args);
       };
       syncBuiltinESMExports();`,
    );
    for (const args of [["--version"], ["check", "--json"]]) {
      const result = child([
        "--import",
        pathToFileURL(preload).href,
        cli,
        ...args,
      ]);
      assert.equal(result.status, 2);
      const output = result.stdout + result.stderr;
      assert.match(output, /INTERNAL_ERROR/);
      assert.ok(!output.includes("SYNTHETIC_METADATA_SECRET"));
      assert.ok(!output.includes(directory));
      assert.doesNotMatch(output, /\bat file:|\bat .*\.js:\d/);
      if (args.includes("--json")) {
        assert.equal(result.stderr, "");
        assert.equal(JSON.parse(result.stdout).error.code, "INTERNAL_ERROR");
      } else {
        assert.equal(result.stdout, "");
      }
    }
  });
}

test("an output I/O failure exits 2 without exposing a native message or stack", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "configpilot output "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const preload = join(directory, "output.mjs");
  writeFileSync(
    preload,
    `import process from "node:process";
     process.stdout.write = () => {
       queueMicrotask(() => process.stdout.emit("error",
         Object.assign(new Error("SYNTHETIC_OUTPUT_SECRET"), { code: "EIO" })));
       return true;
     };`,
  );
  const result = child([
    "--import",
    pathToFileURL(preload).href,
    cli,
    "--help",
  ]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

for (const [scenario, code] of [
  ["open", "FILE_NOT_READABLE"],
  ["descriptor-stat", "FILE_NOT_READABLE"],
  ["replaced-by-device", "NOT_REGULAR_FILE"],
  ["grows-during-read", "FILE_TOO_LARGE"],
  ["read", "FILE_NOT_READABLE"],
  ["close", "FILE_NOT_READABLE"],
  ["short-reads", null],
]) {
  test(`bounded reader handles ${scenario}, closes opened descriptors, and redacts native errors`, () => {
    // Trusted test doubles run in a child so patched built-ins cannot affect
    // concurrent tests. No production injection hooks or dependencies are needed.
    const result = child([
      "--input-type=module",
      "--eval",
      `import assert from "node:assert/strict";
       import fs from "node:fs/promises";
       import { syncBuiltinESMExports } from "node:module";
       const scenario = ${JSON.stringify(scenario)};
       const expectedCode = ${JSON.stringify(code)};
       const nativeError = () => { throw new Error("SYNTHETIC_NATIVE_SECRET"); };
       let closed = 0;
       let reads = 0;
       const regular = { isFile: () => true, size: 1 };
       fs.stat = async () => regular;
       fs.open = async () => {
         if (scenario === "open") nativeError();
         return {
           stat: async () => {
             if (scenario === "descriptor-stat") nativeError();
             return scenario === "replaced-by-device"
               ? { isFile: () => false, size: 0 } : regular;
           },
           read: async (buffer, offset, length, position) => {
             reads++;
             assert.equal(offset, position);
             assert.equal(length, buffer.length - offset);
             if (scenario === "read") nativeError();
             if (scenario === "grows-during-read") {
               buffer.fill(120, offset);
               return { bytesRead: length };
             }
             // Multiple short reads must be accumulated without treating a
             // partial read as EOF or decoding each UTF-8 fragment separately.
             const bytes = [0x41, 0x3d, 0xc3, 0xa9];
             if (position === bytes.length) return { bytesRead: 0 };
             buffer[offset] = bytes[position];
             return { bytesRead: 1 };
           },
           close: async () => {
             closed++;
             if (scenario === "close") nativeError();
           },
         };
       };
       syncBuiltinESMExports();
       const { readConfigFile } = await import(${JSON.stringify(reader)});
       if (expectedCode) {
         await assert.rejects(readConfigFile("selected.env"), (error) => {
           assert.equal(error.code, expectedCode);
           assert.equal(error.message, expectedCode);
           assert.ok(!String(error.stack).includes("SYNTHETIC_NATIVE_SECRET"));
           return true;
         });
       } else {
         assert.equal(await readConfigFile("selected.env"), "A=é");
         assert.equal(reads, 5);
       }
       assert.equal(closed, scenario === "open" ? 0 : 1);
       if (["open", "descriptor-stat", "replaced-by-device"].includes(scenario))
         assert.equal(reads, 0);`,
    ]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "");
  });
}
