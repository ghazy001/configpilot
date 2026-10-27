import assert from "node:assert/strict";
import test from "node:test";
import { scanSource } from "../../src/discovery/source.js";
import { validateOutput } from "../../src/initialization/create.js";
const names = (source, file = "case.ts") =>
  scanSource(source, { file }).references.map((r) => r.name);
test("audit: TypeScript value bindings and parameter default scopes do not invent or drop keys", () => {
  assert.deepEqual(names("enum process { env }; process.env.PORT"), []);
  assert.deepEqual(
    names("namespace process { export const env = {}; } process.env.PORT"),
    [],
  );
  assert.deepEqual(
    names(
      "function f(x = process.env.GLOBAL) { var process = local; return process.env.LOCAL; }",
    ),
    ["GLOBAL"],
  );
});
test("audit: portable output validation excludes all Windows console names and C1 controls", () => {
  for (const output of [
    "CONIN$",
    "conout$",
    "COM¹.env",
    "LPT².env",
    "bad\u0085.env",
  ])
    assert.throws(() => validateOutput(output), {
      code: "INIT_OUTPUT_INVALID",
    });
});
test("audit: adversarial expressions distinguish usage from text and falsy fallbacks", () => {
  const result = scanSource(
    '/* process.env.COMMENT */ const s="process.env.STRING"; const t=`process.env.TEXT ${process.env.REAL}`; process.env.PORT ?? 3000; process.env.DEBUG && debug(); process.env[`API_${suffix}`]; process.env[`API_KEY`];',
  );
  assert.deepEqual(
    result.references.map((r) => r.name),
    ["API_KEY", "DEBUG", "PORT", "REAL"],
  );
  assert.deepEqual(
    result.references.map((r) => r.hasStaticFallback),
    [false, false, true, false],
  );
  assert.equal(
    result.issues.filter((i) => i.code === "SOURCE_DYNAMIC_REFERENCE").length,
    1,
  );
});

test("audit: seeded source mutations preserve privacy and ignore unrelated strings/comments", () => {
  let seed = 7321;
  const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  for (let i = 0; i < 120; i++) {
    const key = `KEY_${next() % 10000}`,
      secret = `SYNTHETIC_FUZZ_CREDENTIAL_${next()}`;
    const forms = [
      `process.env.${key}`,
      `process.env["${key}"]`,
      `process.env[\`${key}\`]`,
      `process.env?.${key}`,
    ];
    const selected = forms[next() % forms.length];
    const source = `/* process.env.COMMENT_${i} */ const text="process.env.STRING_${i}"; const value = ${selected} ?? "${secret}";`;
    const report = scanSource(source);
    assert.deepEqual(
      report.references.map((r) => r.name),
      [key],
    );
    assert.equal(report.references[0].hasStaticFallback, true);
    assert.ok(!JSON.stringify(report).includes(secret));
    assert.deepEqual(scanSource(source), report);
    const malformed = scanSource(`const x = "${secret}\n`);
    assert.equal(malformed.issues[0].code, "SOURCE_PARSE_ERROR");
    assert.ok(!JSON.stringify(malformed).includes(secret));
  }
});
