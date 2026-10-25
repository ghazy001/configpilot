import assert from "node:assert/strict";
import test from "node:test";
import { analyzeConfig, parseDotenv } from "../../src/index.js";

test("seeded configurations preserve declarations, set counts, duplicate locations, and value privacy", () => {
  // Reproducible generated inputs broaden combinations beyond individual grammar
  // examples. The oracle is the list of declarations used to construct each file.
  let seed = 0x51c0ffee;
  function choose(limit) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % limit;
  }
  const keys = [
    "A",
    "a",
    "PORT",
    "_TOKEN",
    "__proto__",
    "constructor",
    "toString",
  ];
  const values = [
    "SYNTHETIC_GENERATED_SECRET=extra # comment",
    '"SYNTHETIC_GENERATED_SECRET # quoted=equals"',
    "'SYNTHETIC_GENERATED_SECRET=single' # comment",
    "`SYNTHETIC_GENERATED_SECRET # backtick`",
    String.raw`"SYNTHETIC_GENERATED_SECRET\"escaped"`,
    "",
  ];
  function generate() {
    const lines = ["# generated fixture", ""];
    const declarations = [];
    const count = choose(32);
    for (let index = 0; index < count; index++) {
      if (choose(3) === 0) lines.push("\t # comment", "");
      const key = keys[choose(keys.length)];
      const prefix = choose(2) ? "\t export " : " ";
      lines.push(`${prefix}${key} \t= ${values[choose(values.length)]} \t`);
      declarations.push({ key, line: lines.length });
    }
    return { text: lines.join(["\n", "\r\n", "\r"][choose(3)]), declarations };
  }

  for (let sample = 0; sample < 128; sample++) {
    const template = generate();
    const environment = generate();
    const expectedIssues = [];
    const sets = {};
    for (const [role, input, file] of [
      ["template", template, ".env.example"],
      ["environment", environment, ".env"],
    ]) {
      const parsed = parseDotenv(input.text, { file });
      assert.deepEqual(
        parsed.declarations,
        input.declarations.map(({ key, line }) => ({
          key,
          location: { file, line },
        })),
      );
      const firstLines = new Map();
      for (const { key, line } of input.declarations) {
        if (firstLines.has(key)) {
          expectedIssues.push([
            "DUPLICATE_KEY",
            role,
            key,
            line,
            firstLines.get(key),
          ]);
        } else firstLines.set(key, line);
      }
      sets[role] = firstLines;
    }
    for (const [role, code, other] of [
      ["template", "MISSING_KEY", "environment"],
      ["environment", "UNDOCUMENTED_KEY", "template"],
    ]) {
      for (const [key, line] of sets[role]) {
        if (!sets[other].has(key))
          expectedIssues.push([code, role, key, line, undefined]);
      }
    }
    expectedIssues.sort((left, right) =>
      left[1] === right[1]
        ? left[3] - right[3]
        : left[1] === "template"
          ? -1
          : 1,
    );
    const options = { template: template.text, environment: environment.text };
    const report = analyzeConfig(options);
    assert.equal(report.comparison, "complete");
    assert.deepEqual(
      report.issues.map(({ code, source, key, location, relatedLocation }) => [
        code,
        source,
        key,
        location.line,
        relatedLocation?.line,
      ]),
      expectedIssues,
    );
    const shared = [...sets.template.keys()].filter((key) =>
      sets.environment.has(key),
    ).length;
    assert.deepEqual(report.summary, {
      errors: 0,
      warnings: expectedIssues.length,
      info: 0,
      total: expectedIssues.length,
      templateKeys: sets.template.size,
      environmentKeys: sets.environment.size,
      sharedKeys: shared,
      missingKeys: sets.template.size - shared,
      undocumentedKeys: sets.environment.size - shared,
    });
    assert.ok(!JSON.stringify(report).includes("SYNTHETIC_GENERATED_SECRET"));
    assert.deepEqual(analyzeConfig(options), report);
    assert.deepEqual(
      analyzeConfig({
        template: options.template.replaceAll(
          "SYNTHETIC_GENERATED_SECRET",
          "DIFFERENT_VALUE",
        ),
        environment: options.environment.replaceAll(
          "SYNTHETIC_GENERATED_SECRET",
          "OTHER_VALUE",
        ),
      }),
      report,
    );
  }
});
