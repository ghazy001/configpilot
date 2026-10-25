import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const expectedFiles = [
  "LICENSE",
  "README.md",
  "bin/configpilot.js",
  "package.json",
  "src/cli.js",
  "src/index.js",
].sort();

function execute(script, args, cwd, env = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 30_000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function listFiles(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = prefix + entry.name;
    return entry.isDirectory()
      ? listFiles(join(directory, entry.name), `${path}/`)
      : [path];
  });
}

test("tarball excludes environment files and works in an offline consumer", (t) => {
  const npmCli = process.env.npm_execpath;
  assert.ok(npmCli, "Run the package verification through npm test.");
  const directory = mkdtempSync(join(tmpdir(), "configpilot package é "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const staging = join(directory, "staging");
  const consumer = join(directory, "consumer");
  mkdirSync(staging);
  mkdirSync(consumer);

  for (const file of expectedFiles) {
    const destination = join(staging, file);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(root, file), destination);
  }
  // Plant synthetic secrets even in allowed runtime directories. No real .env
  // files are copied or inspected, and the source checkout is never modified.
  const sentinel = "TOKEN=SYNTHETIC_PACKAGE_SECRET\n";
  for (const file of [
    ".env",
    ".env.production",
    "src/.env",
    "src/credentials.env",
    "bin/.env.local",
    "unintended.txt",
  ]) {
    writeFileSync(join(staging, file), sentinel);
  }

  const npmEnv = {
    npm_config_cache: join(directory, "cache"),
    npm_config_registry: "http://127.0.0.1:9",
    npm_config_offline: "true",
  };
  const [archive] = JSON.parse(
    execute(
      npmCli,
      ["pack", "--ignore-scripts", "--json", "--pack-destination", directory],
      staging,
      npmEnv,
    ),
  );
  assert.deepEqual(archive.files.map(({ path }) => path).sort(), expectedFiles);
  assert.ok(
    archive.files.find(({ path }) => path === "bin/configpilot.js").mode &
      0o111,
    "The packaged CLI must be executable.",
  );
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  execute(
    npmCli,
    [
      "install",
      join(directory, archive.filename),
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
    ],
    consumer,
    npmEnv,
  );

  const installed = join(consumer, "node_modules", "configpilot");
  assert.deepEqual(listFiles(installed).sort(), expectedFiles);
  for (const file of expectedFiles) {
    assert.ok(
      !readFileSync(join(installed, file), "utf8").includes(
        "SYNTHETIC_PACKAGE_SECRET",
      ),
    );
  }
  const metadata = JSON.parse(
    readFileSync(join(installed, "package.json"), "utf8"),
  );
  assert.equal(metadata.private, true);
  assert.equal(metadata.type, "module");
  assert.equal(metadata.engines.node, ">=20");
  assert.equal(Object.keys(metadata.dependencies ?? {}).length, 0);
  assert.equal(metadata.bin.configpilot, "./bin/configpilot.js");
  assert.ok(
    existsSync(
      join(
        consumer,
        "node_modules",
        ".bin",
        process.platform === "win32" ? "configpilot.cmd" : "configpilot",
      ),
    ),
  );
  assert.equal(
    execute(join(installed, metadata.bin.configpilot), ["--version"], consumer),
    `${metadata.version}\n`,
  );
  assert.match(
    execute(join(installed, metadata.bin.configpilot), ["--help"], consumer),
    /Usage:/,
  );
  const smoke = join(consumer, "smoke.mjs");
  writeFileSync(
    smoke,
    'import assert from "node:assert/strict";\nimport * as api from "configpilot";\nassert.deepEqual(Object.keys(api), []);\n',
  );
  assert.equal(execute(smoke, [], consumer), "");
});
