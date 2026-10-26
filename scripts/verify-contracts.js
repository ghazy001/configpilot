// Development-only independent oracles; minimum-runtime tests need no dev tools.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import Ajv from "ajv/dist/2020.js";
import dotenv from "dotenv";
import { parseDotenv, analyzeConfig, ISSUE_CODES } from "../src/index.js";
import { cliFailure } from "../src/cli.js";

const require = createRequire(import.meta.url);
const schema = JSON.parse(
  readFileSync(require.resolve("configpilot/schema.json"), "utf8"),
);
const validate = new Ajv({ strict: true }).compile(schema);

test("pinned dotenv reference agrees on conventional key sets and duplicates", () => {
  assert.equal(require("dotenv/package.json").version, "18.0.9");
  const values = [
    "",
    "plain",
    "with=equals",
    "#comment",
    '"double # ="',
    "'single # ='",
    "`backtick # =`",
    '"escaped\\"quote"',
    "opaque${NAME}",
    "$(command)",
    'json={"a":1}',
  ];
  for (const ending of ["\n", "\r\n", "\r"]) {
    for (const prefix of ["", "export ", " \texport\t "]) {
      for (const value of values) {
        const source = [
          `${prefix}A = ${value}`,
          `${prefix}B=other`,
          `${prefix}A=duplicate`,
        ].join(ending);
        const parsed = parseDotenv(source);
        assert.deepEqual(
          [...new Set(parsed.declarations.map(({ key }) => key))],
          Object.keys(dotenv.parse(source)),
        );
        assert.deepEqual(
          parsed.issues.map(({ code }) => code),
          ["DUPLICATE_KEY"],
        );
        assert.deepEqual(parsed.issues[0].location, {
          file: "<input>",
          line: 3,
        });
        assert.equal(parsed.issues[0].relatedLocation.line, 1);
      }
    }
  }
});

test("reference multiline value fragments never become ConfigPilot metadata", () => {
  const marker = "SYNTHETIC_REFERENCE_CREDENTIAL";
  for (const quote of ["'", '"', "`"]) {
    for (let slashes = 0; slashes <= 6; slashes++) {
      for (const ending of ["\n", "\r\n", "\r"]) {
        const source = [
          `KEY=${quote}start${"\\".repeat(slashes)}${quote}`,
          `${marker}=x`,
          `${marker}=y`,
          quote,
          "AFTER=x",
        ].join(ending);
        const reference = dotenv.parse(source);
        if (reference.KEY.includes(marker)) {
          assert.ok(!JSON.stringify(parseDotenv(source)).includes(marker));
          assert.ok(
            !JSON.stringify(
              analyzeConfig({ template: "", environment: source }),
            ).includes(marker),
          );
        }
      }
    }
  }
});

test("intentional grammar differences produce explicit diagnostics", () => {
  for (const source of [
    "DOTTED.KEY=x",
    "DASHED-KEY=x",
    "KEY: value",
    "\u00a0KEY=x",
    'KEY="first\nlast"',
  ]) {
    assert.equal(Object.keys(dotenv.parse(source)).length, 1);
    const report = analyzeConfig({ template: source, environment: "" });
    assert.equal(report.comparison, "skipped");
    assert.ok(report.summary.errors > 0);
  }
});

test("schema validates all emitted analysis codes and rejects unsafe structural changes", () => {
  const reports = [
    analyzeConfig({ template: "", environment: "" }),
    analyzeConfig({
      template: "A=x\nA=y\nMISSING=x",
      environment: "A=x\nEXTRA=x",
    }),
    analyzeConfig({
      template: 'KEY="first\nlast"\ninvalid\nDUP=x\nDUP=y',
      environment: "",
    }),
  ];
  assert.deepEqual(
    new Set(reports.flatMap((r) => r.issues.map((i) => i.code))),
    new Set(Object.values(ISSUE_CODES)),
  );
  for (const report of reports)
    assert.equal(validate(report), true, JSON.stringify(validate.errors));
  const complete = reports[1];
  const mutations = [
    { ...complete, schemaVersion: 2 },
    { ...complete, summary: { ...complete.summary, missingKeys: null } },
    {
      ...complete,
      issues: [{ ...complete.issues[0], value: "SYNTHETIC_VALUE" }],
    },
    { ...complete, issues: [{ ...complete.issues[0], code: "UNKNOWN" }] },
    {
      ...complete,
      issues: [{ ...complete.issues[0], location: { file: "x", line: 0 } }],
    },
    { ...reports[2], summary: { ...reports[2].summary, missingKeys: 0 } },
    { ...reports[2], issues: [] },
  ];
  for (const report of mutations) assert.equal(validate(report), false);
});

test("schema distinguishes CLI operational failures from analysis reports", () => {
  for (const code of [
    "INVALID_ARGUMENTS",
    "FILE_NOT_FOUND",
    "FILE_NOT_READABLE",
    "NOT_REGULAR_FILE",
    "FILE_TOO_LARGE",
    "INVALID_ENCODING",
    "INPUT_LIMIT_EXCEEDED",
    "INTERNAL_ERROR",
  ]) {
    const data = JSON.parse(cliFailure(code, true).stdout);
    assert.equal(validate(data), true, JSON.stringify(validate.errors));
    assert.equal(validate({ ...data, summary: {} }), false);
    assert.equal(
      validate({ ...data, error: { ...data.error, raw: "SYNTHETIC_VALUE" } }),
      false,
    );
  }
});

test("deterministic malformed mutations never promote reference value bodies into metadata", () => {
  const marker = "SYNTHETIC_MUTATED_BODY";
  let protectedCases = 0;
  for (const quote of ['"', "'", "`"]) {
    for (let count = 0; count <= 6; count++) {
      for (const prefix of ["KEY=", "export KEY = ", "BAD-KEY=", "KEY: "]) {
        for (const suffix of [
          "",
          " # comment",
          " trailing",
          ` ${quote}chain`,
        ]) {
          for (const closingPrefix of ["", "\\", "\\\\", "value"]) {
            for (const closingSuffix of [
              "",
              " # comment",
              " trailing='chain",
              ` ${quote}chain`,
            ]) {
              const source = [
                prefix + quote + "prefix" + "\\".repeat(count) + quote + suffix,
                marker + "=x",
                marker + "=y",
                closingPrefix + quote + closingSuffix,
                "AFTER=x",
              ].join("\n");
              const reference = dotenv.parse(source);
              if (
                Object.values(reference).some((value) =>
                  value.includes(marker),
                ) &&
                !Object.hasOwn(reference, marker)
              ) {
                protectedCases++;
                assert.ok(
                  !JSON.stringify(parseDotenv(source)).includes(marker),
                );
                assert.ok(
                  !JSON.stringify(
                    analyzeConfig({ template: "", environment: source }),
                  ).includes(marker),
                );
              }
            }
          }
        }
      }
    }
  }
  assert.equal(protectedCases, 1728);
});
