import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtemp,
  writeFile,
  mkdir,
  rm,
  chmod,
  symlink,
  readFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { URL, fileURLToPath } from "node:url";
import { scanProject } from "../../src/discovery/project.js";
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "configpilot adversarial é "));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
test("security: file-count, aggregate-byte and directory-depth limits are enforced", async (t) => {
  const count = await fixture(t);
  for (let start = 0; start < 1001; start += 50)
    await Promise.all(
      Array.from({ length: Math.min(50, 1001 - start) }, (_, i) =>
        writeFile(join(count, `${start + i}.js`), ""),
      ),
    );
  await assert.rejects(scanProject({ root: count }), {
    code: "SCAN_LIMIT_EXCEEDED",
  });
  const bytes = await fixture(t);
  const source = "/*" + " ".repeat(262140) + "*/";
  for (let i = 0; i < 33; i++) await writeFile(join(bytes, `${i}.js`), source);
  await assert.rejects(scanProject({ root: bytes }), {
    code: "SCAN_LIMIT_EXCEEDED",
  });
  const deep = await fixture(t);
  let path = deep;
  for (let i = 0; i < 34; i++) {
    path = join(path, "nested");
    await mkdir(path);
  }
  await writeFile(join(path, "last.js"), "process.env.HIDDEN");
  await assert.rejects(scanProject({ root: deep }), {
    code: "SCAN_LIMIT_EXCEEDED",
  });
});
test("security: inclusive reference limit permits a following empty file", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, "a.js"), "process.env.A;".repeat(4096));
  await writeFile(join(root, "b.js"), "");
  const result = await scanProject({ root });
  assert.equal(result.complete, true);
  assert.equal(result.filesScanned, 2);
  assert.equal(result.variables[0].referenceCount, 4096);
});
test("security: invalid encodings, symlink loops and unreadable input never leak contents", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, "binary.js"), new Uint8Array([255, 254, 251]));
  const binary = await scanProject({ root });
  assert.equal(binary.complete, false);
  assert.equal(binary.issues[0].code, "SOURCE_SKIPPED");
  if (process.platform !== "win32") {
    await symlink(root, join(root, "loop"));
    const loop = await scanProject({ root });
    assert.ok(loop.issues.some((i) => i.code === "SOURCE_SYMLINK_SKIPPED"));
    const file = join(root, "private.js");
    await writeFile(
      file,
      'process.env.PASSWORD || "SYNTHETIC_UNREADABLE_SECRET"',
    );
    await chmod(file, 0);
    try {
      const r = await scanProject({ root });
      assert.ok(!JSON.stringify(r).includes("SYNTHETIC_UNREADABLE_SECRET"));
      assert.equal(r.complete, false);
    } finally {
      await chmod(file, 0o600);
    }
  }
});
test("security: injected partial write reports failure, preserves partial new file and sanitizes exception", async (t) => {
  const root = await fixture(t),
    url = new URL("../../src/initialization/create.js", import.meta.url).href;
  const code = `import fs from "node:fs/promises";import {syncBuiltinESMExports} from "node:module";
 const original=fs.open;fs.open=async(...args)=>{const file=await original(...args);const write=file.writeFile.bind(file);file.writeFile=async content=>{await write(content.slice(0,6));throw new Error("SYNTHETIC_WRITE_CREDENTIAL");};return file;};syncBuiltinESMExports();
 const {createEnvFile}=await import(${JSON.stringify(url)});try{await createEnvFile({root:${JSON.stringify(root)},output:".env",content:"TOKEN=\\n",confirmed:true});process.exitCode=1;}catch(error){process.stdout.write(JSON.stringify({code:error.code,message:error.message}));}`;
  const r = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", code],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).code, "INIT_WRITE_FAILED");
  assert.ok(!r.stdout.includes("SYNTHETIC_WRITE_CREDENTIAL"));
  assert.equal(await readFile(join(root, ".env"), "utf8"), "TOKEN=");
});

test("security: parser worker failures cannot become a clean scan or leak quoted bodies", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, "many.js"), "process.env.A;".repeat(4097));
  const result = await scanProject({ root });
  assert.equal(result.complete, false);
  assert.ok(result.issues.some((i) => i.code === "SOURCE_SKIPPED"));
  await writeFile(
    join(root, "many.js"),
    "const credential = `SYNTHETIC_MULTILINE_CREDENTIAL\nSYNTHETIC_SECOND_LINE`; process.env[`KEY_${dynamic}`]",
  );
  const clean = await scanProject({ root });
  assert.equal(clean.complete, true);
  assert.ok(!JSON.stringify(clean).includes("SYNTHETIC_"));
  assert.equal(clean.issues[0].code, "SOURCE_DYNAMIC_REFERENCE");
});

test("security: CLI output failure before approval cannot create a configuration file", async (t) => {
  const root = await fixture(t),
    cli = new URL("../../bin/configpilot.js", import.meta.url);
  await writeFile(join(root, "app.js"), "process.env.PORT");
  const preload = join(root, "injected-output.mjs");
  await writeFile(
    preload,
    'Object.defineProperty(process.stdin,"isTTY",{value:true});Object.defineProperty(process.stdout,"isTTY",{value:true});process.stdout.write=()=>{setImmediate(()=>process.stdout.emit("error",Object.assign(new Error("SYNTHETIC_OUTPUT_SECRET"),{code:"EIO"})));return false;};',
  );
  const r = spawnSync(
    process.execPath,
    ["--import", preload, fileURLToPath(cli), "init"],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        CI: "",
        GITHUB_ACTIONS: "",
        TF_BUILD: "",
        NO_COLOR: "1",
        FORCE_COLOR: "0",
      },
    },
  );
  assert.ifError(r.error);
  assert.equal(r.status, 2);
  assert.ok(!r.stdout.includes("SYNTHETIC_OUTPUT_SECRET"));
  assert.ok(!r.stderr.includes("SYNTHETIC_OUTPUT_SECRET"));
  await assert.rejects(readFile(join(root, ".env")), { code: "ENOENT" });
});
