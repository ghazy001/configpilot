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
import { dirname, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const expectedFiles = [
  "LICENSE",
  "README.md",
  "bin/configpilot.js",
  "docs/PARSER.md",
  "docs/REPORT.md",
  "docs/CLI.md",
  "docs/TROUBLESHOOTING.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "package.json",
  "src/cli.js",
  "src/index.js",
  "src/index.d.ts",
  "src/parser/dotenv-parser.js",
  "src/analyzer/config-analyzer.js",
  "src/diagnostics/issue-codes.js",
  "src/reporters/json.js",
  "src/reporters/terminal.js",
  "src/utils/read-config-file.js",
  "src/utils/input-limits.js",
  "schemas/report.schema.json",
].sort();

function execute(script, args, cwd, env = {}, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 30_000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, expectedStatus, result.stderr);
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
  const stagedArchives = join(directory, "staged-archives");
  const actualArchives = join(directory, "actual-archives");
  mkdirSync(stagedArchives);
  mkdirSync(actualArchives);

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
    "src/parser/.env",
    "src/analyzer/.env",
    "src/diagnostics/.env",
    "src/reporters/.env",
    "src/utils/.env",
    "bin/.env.local",
    "unintended.txt",
    "schemas/.env",
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
      [
        "pack",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        stagedArchives,
      ],
      staging,
      npmEnv,
    ),
  );
  assert.deepEqual(archive.files.map(({ path }) => path).sort(), expectedFiles);
  // The staged secret test cannot detect accidental publishable files that only
  // exist in the checkout. Independently check its real file list before packing.
  const [dryRun] = JSON.parse(
    execute(
      npmCli,
      ["pack", "--dry-run", "--ignore-scripts", "--json"],
      root,
      npmEnv,
    ),
  );
  assert.deepEqual(dryRun.files.map(({ path }) => path).sort(), expectedFiles);
  const [actual] = JSON.parse(
    execute(
      npmCli,
      [
        "pack",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        actualArchives,
      ],
      root,
      npmEnv,
    ),
  );
  assert.deepEqual(actual.files.map(({ path }) => path).sort(), expectedFiles);
  // Windows filesystems do not preserve POSIX executable bits. Verify those on
  // POSIX; both platforms still execute their actual installed npm shim below.
  if (process.platform !== "win32") {
    for (const packed of [archive, actual]) {
      assert.ok(
        packed.files.find(({ path }) => path === "bin/configpilot.js").mode &
          0o111,
        "The packaged CLI must be executable on POSIX.",
      );
    }
  }
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  execute(
    npmCli,
    [
      "install",
      join(actualArchives, actual.filename),
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
    assert.deepEqual(
      readFileSync(join(installed, file)),
      readFileSync(join(root, file)),
      `Installed content differs from checkout: ${file}`,
    );
    assert.ok(
      !readFileSync(join(installed, file), "utf8").includes(
        "SYNTHETIC_PACKAGE_SECRET",
      ),
    );
    if (file.endsWith(".md")) {
      const content = readFileSync(join(installed, file), "utf8");
      for (const [, href] of content.matchAll(/\[[^\]\n]+\]\(([^)]+)\)/g)) {
        if (/^https?:|^#/.test(href)) continue;
        const target = relative(
          installed,
          resolve(dirname(join(installed, file)), href.split("#")[0]),
        )
          .split(sep)
          .join("/");
        assert.ok(
          expectedFiles.includes(target),
          `Broken installed link in ${file}: ${href}`,
        );
      }
    }
  }
  const metadata = JSON.parse(
    readFileSync(join(installed, "package.json"), "utf8"),
  );
  assert.equal(Object.hasOwn(metadata, "private"), false);
  assert.deepEqual(metadata.publishConfig, {
    registry: "https://registry.npmjs.org/",
    access: "public",
    tag: "latest",
  });
  assert.equal(metadata.type, "module");
  assert.equal(metadata.main, "./src/index.js");
  assert.equal(metadata.types, "./src/index.d.ts");
  assert.deepEqual(metadata.exports, {
    ".": { types: "./src/index.d.ts", default: "./src/index.js" },
    "./schema.json": "./schemas/report.schema.json",
  });
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
    `import assert from "node:assert/strict";
import { analyzeConfig, parseDotenv, ISSUE_CODES } from "configpilot";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const schema=JSON.parse(readFileSync(createRequire(import.meta.url).resolve("configpilot/schema.json"),"utf8"));
assert.ok(schema.$defs.complete);
const result = parseDotenv("TOKEN=SYNTHETIC_CONSUMER_SECRET\\nTOKEN=other", { file: ".env" });
assert.deepEqual(result.declarations.map(({ key }) => key), ["TOKEN", "TOKEN"]);
assert.equal(result.issues[0].code, "DUPLICATE_KEY");
assert.equal(result.issues[0].relatedLocation.line, 1);
assert.ok(!JSON.stringify(result).includes("SYNTHETIC_CONSUMER_SECRET"));
const report = analyzeConfig({
  template: "DATABASE_URL=SYNTHETIC_CONSUMER_SECRET\\nPORT=3000",
  environment: "PORT=4000\\nREDIS_URL=SYNTHETIC_CONSUMER_SECRET"
});
assert.equal(report.schemaVersion, 1);
assert.equal(report.comparison, "complete");
assert.deepEqual(report.issues.map(({ code }) => code), [ISSUE_CODES.MISSING_KEY, ISSUE_CODES.UNDOCUMENTED_KEY]);
assert.equal(report.summary.sharedKeys, 1);
assert.equal(report.summary.warnings, 2);
assert.ok(!JSON.stringify(report).includes("SYNTHETIC_CONSUMER_SECRET"));
const credential = ['KEY="prefix' + String.fromCharCode(92).repeat(2) + '"',
  'SYNTHETIC_INSTALLED_FRAGMENT=x', 'SYNTHETIC_INSTALLED_FRAGMENT=y', '"'].join("\\n");
const hardened = analyzeConfig({template: "KEY=", environment: credential});
assert.equal(hardened.comparison, "skipped");
assert.ok(!JSON.stringify(hardened).includes("SYNTHETIC_INSTALLED_FRAGMENT"));
const whitespaceCredential = 'KEY=\\u00a0"first\\nSYNTHETIC_INSTALLED_WHITESPACE=x\\nSYNTHETIC_INSTALLED_WHITESPACE=y\\n"\\nAFTER=x';
const quarantined = analyzeConfig({template: "AFTER=", environment: whitespaceCredential});
assert.equal(quarantined.comparison, "skipped");
assert.equal(quarantined.issues[0].code, "INVALID_DECLARATION");
assert.ok(!JSON.stringify(quarantined).includes("SYNTHETIC_INSTALLED_WHITESPACE"));
assert.throws(() => parseDotenv("A=x\\n".repeat(2049)), RangeError);
`,
  );
  assert.equal(execute(smoke, [], consumer), "");
  writeFileSync(join(consumer, ".env.example"), "PORT=3000\nTOKEN=example");
  writeFileSync(
    join(consumer, ".env"),
    "PORT=4000\nTOKEN=SYNTHETIC_INSTALLED_SECRET",
  );
  const installedCli = join(installed, metadata.bin.configpilot);
  const clean = JSON.parse(
    execute(installedCli, ["check", "--json"], consumer),
  );
  assert.equal(clean.summary.total, 0);
  {
    const shim = join(
      consumer,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "configpilot.cmd" : "configpilot",
    );
    const executable =
      process.platform === "win32"
        ? spawnSync("cmd.exe", ["/d", "/s", "/c", `""${shim}" check --json"`], {
            cwd: consumer,
            encoding: "utf8",
            timeout: 10_000,
            windowsVerbatimArguments: true,
          })
        : spawnSync(shim, ["check", "--json"], {
            cwd: consumer,
            encoding: "utf8",
            timeout: 10_000,
          });
    assert.ifError(executable.error);
    assert.equal(executable.status, 0);
    assert.equal(executable.stderr, "");
    assert.deepEqual(JSON.parse(executable.stdout), clean);
  }
  writeFileSync(
    join(consumer, ".env"),
    "PORT=4000\nEXTRA=SYNTHETIC_INSTALLED_SECRET",
  );
  const output = execute(installedCli, ["check", "--json"], consumer, {}, 1);
  assert.equal(JSON.parse(output).summary.warnings, 2);
  assert.ok(!output.includes("SYNTHETIC_INSTALLED_SECRET"));
  writeFileSync(
    join(consumer, ".env"),
    "PORT=SYNTHETIC_LIMIT_SECRET\n".repeat(2049),
  );
  const limited = execute(installedCli, ["check", "--json"], consumer, {}, 2);
  assert.equal(JSON.parse(limited).error.code, "INPUT_LIMIT_EXCEEDED");
  assert.ok(!limited.includes("SYNTHETIC_LIMIT_SECRET"));
});
