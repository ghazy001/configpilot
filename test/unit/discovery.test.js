import assert from "node:assert/strict";
import test from "node:test";
import { scanSource, classifyVariable } from "../../src/discovery/source.js";

test("AST extraction handles JS/TS/JSX/TSX, defaults and dynamic keys without literals", () => {
  const code = `// process.env.COMMENT
const unrelated = "process.env.STRING";
const a = process.env.DATABASE_URL;
const b = process.env["JWT_SECRET"];
const c = process.env['JWT_SECRET'];
const d = import.meta.env.VITE_API_URL;
const e = process.env.PORT ?? 3000;
const f = process.env.NODE_ENV || 'SYNTHETIC_SECRET';
const g = process.env[variableName];`;
  const result = scanSource(code);
  assert.deepEqual(
    result.references.map((r) => r.name),
    [
      "DATABASE_URL",
      "JWT_SECRET",
      "JWT_SECRET",
      "VITE_API_URL",
      "PORT",
      "NODE_ENV",
    ],
  );
  assert.equal(result.references[4].hasStaticFallback, true);
  assert.equal(result.references[0].location.line, 3);
  assert.equal(result.issues[0].code, "SOURCE_DYNAMIC_REFERENCE");
  assert.ok(!JSON.stringify(result).includes("SYNTHETIC_SECRET"));
  for (const file of ["page.js", "page.jsx", "page.tsx"])
    assert.equal(
      scanSource("const a = <div>{process.env.API_KEY}</div>", { file })
        .references[0].name,
      "API_KEY",
    );
  assert.equal(
    scanSource("const x: string = process.env.API_KEY!", { file: "backend.ts" })
      .references[0].name,
    "API_KEY",
  );
});
test("malformed code, unrelated objects and shadowed process never invent names", () => {
  assert.equal(
    scanSource('const x = "SYNTHETIC_SECRET').issues[0].code,
    "SOURCE_PARSE_ERROR",
  );
  assert.deepEqual(
    scanSource(
      "other.env.KEY; function f(process) { return process.env.LOCAL; }",
    ).references,
    [],
  );
  assert.equal(
    scanSource('process.env["not-a-portable-secret"]').issues[0].code,
    "SOURCE_DYNAMIC_REFERENCE",
  );
});
test("binding suppression follows bindings rather than property keys or default expressions", () => {
  assert.equal(
    scanSource(
      "const {process: other} = obj; function f(x = process) { return process.env.PORT; }",
    ).references[0].name,
    "PORT",
  );
  for (const source of [
    "const {x: process} = obj; process.env.LOCAL;",
    "const [process] = values; process.env.LOCAL;",
    "function f(...process) { return process.env.LOCAL; }",
    "function f(process = fallback) { return process.env.LOCAL; }",
    "const C = class process { f() { return process.env.LOCAL; } }",
  ])
    assert.equal(scanSource(source).references.length, 0);
});

test("classifications are deterministic heuristics, never requiredness assertions", () => {
  assert.equal(classifyVariable("OPENAI_API_KEY").potentiallySensitive, true);
  assert.equal(classifyVariable("JWT_SECRET").category, "Authentication");
  assert.equal(
    classifyVariable("DATABASE_URL").category,
    "Database configuration",
  );
  assert.equal(classifyVariable("PORT").category, "Server configuration");
  assert.equal(
    classifyVariable("DEV", "import.meta.env").frameworkProvided,
    true,
  );
  assert.equal(classifyVariable("UNKNOWN").confidence, "low");
});

test("project aggregation records counts, classifications and selected configuration only", async (t) => {
  const { mkdtemp, writeFile, mkdir, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { scanProject } = await import("../../src/discovery/project.js");
  const root = await mkdtemp(join(tmpdir(), "configpilot scan é "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "app.ts"),
    "process.env.PORT ?? 3000; process.env.PORT; process.env.JWT_SECRET; import.meta.env.DEV;",
  );
  await writeFile(join(root, ".env.example"), "PORT=\n");
  await writeFile(join(root, ".env"), "PORT=SYNTHETIC_LOCAL_SECRET\n");
  await writeFile(join(root, ".env.production"), "invalid unselected\n");
  await mkdir(join(root, "node_modules"));
  await writeFile(
    join(root, "node_modules", "ignored.js"),
    "process.env.IGNORED",
  );
  const result = await scanProject({ root });
  assert.equal(result.complete, true);
  assert.equal(result.filesScanned, 1);
  assert.deepEqual(
    result.variables.map((v) => v.name),
    ["DEV", "JWT_SECRET", "PORT"],
  );
  assert.equal(result.variables[2].referenceCount, 2);
  assert.equal(result.variables[2].hasStaticFallback, true);
  assert.equal(result.variables[1].inTemplate, false);
  assert.equal(result.variables[0].frameworkProvided, true);
  assert.ok(result.issues.some((i) => i.code === "SOURCE_MISSING_LOCAL_KEY"));
  assert.ok(!JSON.stringify(result).includes("SYNTHETIC_LOCAL_SECRET"));
});

test("reference, output and filesystem limits fail safely", async (t) => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { scanProject } = await import("../../src/discovery/project.js");
  const { generateEnvTemplate } =
    await import("../../src/initialization/template.js");
  assert.throws(() => scanSource(" ".repeat(262145)), RangeError);
  assert.throws(() => scanSource("process.env.A;".repeat(4097)), RangeError);
  assert.throws(
    () =>
      generateEnvTemplate({
        complete: true,
        variables: Array.from({ length: 4096 }, (_, i) => ({
          name: `KEY_${i}`,
        })),
      }),
    RangeError,
  );
  const root = await mkdtemp(join(tmpdir(), "configpilot limits "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "a.js"), "process.env.A;");
  await writeFile(join(root, ".env.example"), 'A="SYNTHETIC_BROKEN_SECRET');
  const result = await scanProject({ root });
  assert.equal(result.complete, false);
  assert.ok(!JSON.stringify(result).includes("SYNTHETIC_BROKEN_SECRET"));
});

test("legacy TypeScript decorators are parsed without invoking them", () => {
  const result = scanSource(
    "@Controller() class API { @Get() handler() { return process.env.API_KEY; } }",
    { file: "controller.ts" },
  );
  assert.equal(result.issues.length, 0);
  assert.equal(result.references[0].name, "API_KEY");
});

test("directory entry budget fails before parsing an unbounded listing", async (t) => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { scanProject } = await import("../../src/discovery/project.js");
  const root = await mkdtemp(join(tmpdir(), "configpilot entries "));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (let start = 0; start < 5001; start += 100)
    await Promise.all(
      Array.from({ length: Math.min(100, 5001 - start) }, (_, i) =>
        writeFile(join(root, `entry-${start + i}.txt`), ""),
      ),
    );
  await assert.rejects(scanProject({ root }), { code: "SCAN_LIMIT_EXCEEDED" });
});
