import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { analyzeConfig, parseDotenv } from "../../src/index.js";
import { formatJson } from "../../src/reporters/json.js";

const marker = "SYNTHETIC_CREDENTIAL_FRAGMENT";

test("ambiguous quote boundaries quarantine credential fragments in all public results", () => {
  for (const quote of ["'", '"', "`"]) {
    for (const ending of ["\n", "\r\n", "\r"]) {
      for (const slashes of [2, 4, 6]) {
        for (const prefix of ["KEY=", "BAD-KEY=", "MISSING_EQUALS "]) {
          const source = [
            `${prefix}${quote}prefix${"\\".repeat(slashes)}${quote}`,
            `${marker}=part1`,
            `${marker}=part2`,
            quote,
            "AFTER=x",
          ].join(ending);
          const parsed = parseDotenv(source);
          assert.deepEqual(
            parsed.declarations.map(({ key }) => key),
            ["AFTER"],
          );
          assert.ok(parsed.issues.length > 0);
          const report = analyzeConfig({
            template: "AFTER=",
            environment: source,
          });
          assert.equal(report.comparison, "skipped");
          assert.ok(!JSON.stringify({ parsed, report }).includes(marker));
        }
      }
    }
  }
});

test("escaped fallback closers and chained ambiguous blocks remain quarantined", () => {
  for (const quote of ["'", '"', "`"]) {
    const source = `KEY=${quote}prefix\\\\${quote}\n${marker}=x\n${marker}=y\nlast\\${quote}`;
    assert.ok(!JSON.stringify(parseDotenv(source)).includes(marker));
    const chained = `KEY=${quote}start\nend\\\\${quote}\n${marker}=x\n${marker}=y\n${quote}\nAFTER=x`;
    assert.deepEqual(
      parseDotenv(chained).declarations.map(({ key }) => key),
      ["AFTER"],
    );
  }
});

test("unambiguous single-line trailing backslashes retain their declarations", () => {
  for (const quote of ["'", '"', "`"]) {
    const source = `KEY=${quote}path\\\\${quote}\nAFTER=x`;
    assert.deepEqual(
      parseDotenv(source).declarations.map(({ key }) => key),
      ["KEY", "AFTER"],
    );
    assert.deepEqual(parseDotenv(source).issues, []);
  }
});

test("record budget accepts its boundary and rejects dense duplicates and syntax errors safely", () => {
  assert.equal(parseDotenv("A=x\n".repeat(2048)).issues.length, 2047);
  assert.equal(parseDotenv("invalid\n".repeat(2048)).issues.length, 2048);
  for (const source of ["A=x\n".repeat(2049), "invalid\n".repeat(2049)]) {
    assert.throws(() => parseDotenv(source), {
      name: "RangeError",
      message: "Input exceeds the declaration or public-metadata budget.",
    });
    assert.throws(
      () => analyzeConfig({ template: "", environment: source }),
      RangeError,
    );
  }
  assert.deepEqual(parseDotenv("\n".repeat(1_048_576)), {
    declarations: [],
    issues: [],
  });
});

test("public labels and aggregate metadata cannot amplify reports without bounds", () => {
  const file = "f".repeat(4096);
  const keys = Array.from({ length: 32 }, (_, i) => `K${i}=x`);
  assert.equal(
    parseDotenv(keys.slice(0, 31).join("\n"), { file }).declarations.length,
    31,
  );
  assert.throws(() => parseDotenv(keys.join("\n"), { file }), RangeError);
  assert.throws(() => parseDotenv("", { file: file + "f" }), RangeError);
  assert.throws(
    () => parseDotenv("A=x\nA=y\n".repeat(16), { file }),
    RangeError,
  );
  assert.throws(() => parseDotenv("bad\n".repeat(33), { file }), RangeError);
});

test("largest ordinary key sets have accurate counts and bounded serialized output", () => {
  const template = Array.from(
    { length: 2048 },
    (_, i) => `EXPECTED_${i}=x`,
  ).join("\n");
  const environment = Array.from(
    { length: 2048 },
    (_, i) => `ACTUAL_${i}=y`,
  ).join("\n");
  const report = analyzeConfig({ template, environment });
  assert.equal(report.summary.warnings, 4096);
  assert.equal(report.summary.missingKeys, 2048);
  assert.equal(report.summary.undocumentedKeys, 2048);
  assert.ok(formatJson(report).length < 5 * 1024 * 1024);
});

test("coverage gate rejects missing, malformed and below-floor core results", async () => {
  const { coreCoveragePassed } =
    await import("../../scripts/verify-coverage.js");
  const root = resolve("synthetic root");
  const valid = [
    "src/parser/dotenv-parser.js",
    "src/analyzer/config-analyzer.js",
  ].map((path) => ({
    path: resolve(root, path),
    coveredLinePercent: 90,
    coveredBranchPercent: 100,
  }));
  assert.equal(coreCoveragePassed(valid, root), true);
  assert.equal(
    coreCoveragePassed(
      [{ ...valid[0], coveredLinePercent: 89.99 }, valid[1]],
      root,
    ),
    false,
  );
  assert.equal(
    coreCoveragePassed(
      [{ ...valid[0], coveredBranchPercent: NaN }, valid[1]],
      root,
    ),
    false,
  );
  assert.equal(coreCoveragePassed([valid[0]], root), false);
  assert.equal(coreCoveragePassed([], root), false);
  assert.equal(coreCoveragePassed(undefined, root), false);
  assert.equal(
    coreCoveragePassed([null, ...valid], resolve("other root")),
    false,
  );
});

test("overlapping malformed ambiguous blocks cannot expose either interpretation's body", () => {
  const source =
    'KEY="first\nend\\\\" trailing "second\nSYNTHETIC_CREDENTIAL_FRAGMENT=x\nSYNTHETIC_CREDENTIAL_FRAGMENT=y\n"\nAFTER=x';
  const result = parseDotenv(source);
  assert.ok(!JSON.stringify(result).includes("SYNTHETIC_CREDENTIAL_FRAGMENT"));
  assert.ok(result.issues.length > 0);
});

test("runtime exposes exactly the documented named exports", async () => {
  const api = await import("../../src/index.js");
  assert.deepEqual(Object.keys(api).sort(), [
    "ISSUE_CODES",
    "analyzeConfig",
    "parseDotenv",
  ]);
});

test("structured reporter emits only coverage file statistics", async () => {
  const { default: reporter } =
    await import("../../scripts/coverage-reporter.js");
  const files = [
    {
      path: "file.js",
      coveredLinePercent: 100,
      coveredBranchPercent: 95,
      lines: [{ line: 1, count: 1 }],
    },
  ];
  const output = [];
  for await (const chunk of reporter([
    { type: "test:pass", data: {} },
    { type: "test:coverage", data: { summary: { files } } },
  ]))
    output.push(chunk);
  assert.deepEqual(JSON.parse(output.join("")), [
    { path: "file.js", coveredLinePercent: 100, coveredBranchPercent: 95 },
  ]);
});
