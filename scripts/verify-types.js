import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, "Run declaration verification through npm run test:types.");
const compilers = ["typescript-minimum", "typescript"];
const directory = mkdtempSync(join(tmpdir(), "configpilot types é "));
const env = {
  ...process.env,
  npm_config_cache: join(directory, "cache"),
  npm_config_registry: "http://127.0.0.1:9",
  npm_config_offline: "true",
};

function execute(script, args, cwd) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    env,
    encoding: "utf8",
    timeout: 60_000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

try {
  mkdirSync(join(directory, "empty-types"));
  const consumer = join(directory, "consumer");
  mkdirSync(consumer);
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  const [packed] = JSON.parse(
    execute(
      npmCli,
      ["pack", "--ignore-scripts", "--json", "--pack-destination", directory],
      root,
    ),
  );
  execute(
    npmCli,
    [
      "install",
      join(directory, packed.filename),
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
    ],
    consumer,
  );
  for (const file of ["consumer.mts", "invalid.mts"]) {
    copyFileSync(join(root, "type-tests", file), join(consumer, file));
  }
  for (const compilerName of compilers) {
    const compiler = fileURLToPath(
      new URL(`../node_modules/${compilerName}/bin/tsc`, import.meta.url),
    );
    const common = [
      "--strict",
      "--exactOptionalPropertyTypes",
      "--target",
      "ES2022",
      "--skipLibCheck",
      "false",
      "--typeRoots",
      join(directory, "empty-types"),
      ...(compilerName === "typescript" ? ["--ignoreConfig"] : []),
    ];
    // Compile the installed package, with no path mapping back to this checkout.
    for (const [module, resolution] of [
      ["NodeNext", "NodeNext"],
      ["ESNext", "Bundler"],
    ]) {
      execute(
        compiler,
        [
          ...common,
          "--module",
          module,
          "--moduleResolution",
          resolution,
          "--noEmit",
          "consumer.mts",
          "invalid.mts",
        ],
        consumer,
      );
    }
    execute(
      compiler,
      [
        ...common,
        "--module",
        "NodeNext",
        "--moduleResolution",
        "NodeNext",
        "--outDir",
        "output",
        "consumer.mts",
      ],
      consumer,
    );
    assert.equal(
      execute(join(consumer, "output", "consumer.mjs"), [], consumer),
      "",
    );
  }
  // CommonJS consumers can use dynamic import without a synchronous CJS entry.
  writeFileSync(
    join(consumer, "smoke.cjs"),
    `import("configpilot").then(({ analyzeConfig }) => {
  if (analyzeConfig({ template: "", environment: "" }).summary.total !== 0) process.exitCode = 1;
}).catch(() => { process.exitCode = 1; });\n`,
  );
  assert.equal(execute(join(consumer, "smoke.cjs"), [], consumer), "");
  process.stdout.write(
    "Installed declarations passed TypeScript 5.0.4/7.0.2 NodeNext/Bundler positive and negative checks; emitted ESM and CommonJS dynamic import passed.\n",
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
