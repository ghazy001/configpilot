import assert from "node:assert/strict";
import test from "node:test";
import { scanSource } from "../../src/discovery/source.js";
const names = (source) =>
  scanSource(source)
    .references.map((r) => r.name)
    .sort();
test("audit: Node process imports and lexical shadowing preserve actual global references", () => {
  assert.deepEqual(
    names('import process from "node:process"; process.env.PORT'),
    ["PORT"],
  );
  assert.deepEqual(
    names("function f(process){ process.env.LOCAL } process.env.GLOBAL"),
    ["GLOBAL"],
  );
  assert.deepEqual(
    names("{ const process = local; process.env.LOCAL } process.env.GLOBAL"),
    ["GLOBAL"],
  );
  assert.deepEqual(names('import * as p from "node:process"; p.env.PORT'), [
    "PORT",
  ]);
});
test("audit: immutable env aliases and destructuring discover keys without copying defaults", () => {
  assert.deepEqual(names("const env=process.env; env.API_KEY;"), ["API_KEY"]);
  assert.deepEqual(
    scanSource("const env=process.env; env.API_KEY;").issues,
    [],
  );
  assert.deepEqual(
    names(
      'const {DATABASE_URL, JWT_SECRET: secret = "SYNTHETIC_SECRET"} = process.env;',
    ),
    ["DATABASE_URL", "JWT_SECRET"],
  );
  const report = scanSource(
    'const {JWT_SECRET: secret = "SYNTHETIC_SECRET"} = process.env;',
  );
  assert.equal(report.references[0].hasStaticFallback, true);
  assert.ok(!JSON.stringify(report).includes("SYNTHETIC_SECRET"));
  assert.deepEqual(
    names("const env=process.env; function f(env){env.LOCAL} env.API_KEY;"),
    ["API_KEY"],
  );
});
test("audit: constant template keys, TS wrappers and optional lookups are real AST references", () => {
  assert.deepEqual(names("process.env[`API_KEY`]; process.env?.PORT;"), [
    "API_KEY",
    "PORT",
  ]);
  const report = scanSource("(process.env.PORT as string) ?? 3000", {
    file: "app.ts",
  });
  assert.equal(report.references[0].hasStaticFallback, true);
  assert.deepEqual(report.issues, []);
  assert.equal(
    scanSource("process.env[`API_${suffix}`]").issues[0].code,
    "SOURCE_DYNAMIC_REFERENCE",
  );
});
test("audit: escaped or unsupported environment objects are never silently complete", () => {
  for (const source of [
    "const env=process.env; use(env);",
    "let env=process.env; env.KEY;",
    "const {...rest}=process.env;",
  ])
    assert.ok(
      scanSource(source).issues.some(
        (i) => i.code === "SOURCE_DYNAMIC_REFERENCE",
      ),
      source,
    );
});

test("audit: UTF-8 source budget counts bytes, not just UTF-16 length", () => {
  assert.throws(() => scanSource("/*" + "é".repeat(140000) + "*/"), RangeError);
});

test("framework syntax matrix keeps public prefixes separate from credentials", () => {
  const cases = [
    ["node.js", "process.env.NODE_ENV; process.env.PORT", ["NODE_ENV", "PORT"]],
    ["express.js", "app.listen(process.env.PORT || 3000)", ["PORT"]],
    [
      "fastify.ts",
      "await app.listen({port:Number(process.env.PORT)})",
      ["PORT"],
    ],
    [
      "next.tsx",
      "const p=<div>{process.env.NEXT_PUBLIC_API_URL}</div>",
      ["NEXT_PUBLIC_API_URL"],
    ],
    [
      "vite.ts",
      "import.meta.env.VITE_API_URL; import.meta.env.DEV",
      ["DEV", "VITE_API_URL"],
    ],
    [
      "react.jsx",
      "const p=<div>{process.env.REACT_APP_API_URL}</div>",
      ["REACT_APP_API_URL"],
    ],
    [
      "vue.ts",
      "import.meta.env.VITE_API_URL; process.env.VUE_APP_API_URL",
      ["VITE_API_URL", "VUE_APP_API_URL"],
    ],
  ];
  for (const [file, source, expected] of cases) {
    const r = scanSource(source, { file });
    assert.deepEqual(r.references.map((r) => r.name).sort(), expected);
    assert.deepEqual(r.issues, []);
  }
});

test("Node builtin require/import aliases and class static scopes retain lexical accuracy", () => {
  assert.deepEqual(
    names('const p=require("node:process"); const {env}=p; env.PORT'),
    ["PORT"],
  );
  assert.deepEqual(
    names('import {env as settings} from "node:process"; settings.PORT'),
    ["PORT"],
  );
  assert.deepEqual(
    names(
      "class C { static { var process=local; process.env.LOCAL; } m(){return process.env.GLOBAL} }",
    ),
    ["GLOBAL"],
  );
  assert.equal(
    scanSource(
      "declare const process: {env:Record<string,string>}; process.env.PORT",
      { file: "app.ts" },
    ).references[0].name,
    "PORT",
  );
});
