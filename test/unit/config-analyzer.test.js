import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { inspect } from "node:util";
import test from "node:test";
import { analyzeConfig, ISSUE_CODES, parseDotenv } from "../../src/index.js";

test("matching keys ignore value differences and return a complete summary", () => {
  assert.deepEqual(
    analyzeConfig({
      template: "PORT=3000\nTOKEN=",
      environment: "TOKEN=example\nPORT=4000",
    }),
    {
      schemaVersion: 1,
      comparison: "complete",
      issues: [],
      summary: {
        errors: 0,
        warnings: 0,
        info: 0,
        total: 0,
        templateKeys: 2,
        environmentKeys: 2,
        sharedKeys: 2,
        missingKeys: 0,
        undocumentedKeys: 0,
      },
    },
  );
});

test("a realistic mismatch explains missing and undocumented keys without assuming a broken deployment", () => {
  const result = analyzeConfig({
    template: "DATABASE_URL=example\nPORT=3000",
    environment: "PORT=4000\nREDIS_URL=example",
  });
  assert.equal(result.comparison, "complete");
  assert.deepEqual(result.summary, {
    errors: 0,
    warnings: 2,
    info: 0,
    total: 2,
    templateKeys: 2,
    environmentKeys: 2,
    sharedKeys: 1,
    missingKeys: 1,
    undocumentedKeys: 1,
  });
  assert.deepEqual(
    result.issues.map(({ code, severity, key, source, location }) => ({
      code,
      severity,
      key,
      source,
      location,
    })),
    [
      {
        code: "MISSING_KEY",
        severity: "warning",
        key: "DATABASE_URL",
        source: "template",
        location: { file: ".env.example", line: 1 },
      },
      {
        code: "UNDOCUMENTED_KEY",
        severity: "warning",
        key: "REDIS_URL",
        source: "environment",
        location: { file: ".env", line: 2 },
      },
    ],
  );
  assert.match(result.issues[0].message, /may be supplied externally/);
  assert.match(result.issues[0].recommendation, /deployment environment/);
  assert.match(result.issues[1].recommendation, /reference template/);
});

for (const [name, template, environment, expectedCodes, expectedCounts] of [
  ["both empty", "", "", [], [0, 0, 0, 0, 0]],
  ["comments only", "# expected\n\t", "# actual\r\n", [], [0, 0, 0, 0, 0]],
  [
    "empty environment",
    "A=\nB=",
    "",
    ["MISSING_KEY", "MISSING_KEY"],
    [2, 0, 0, 2, 0],
  ],
  [
    "empty template",
    "",
    "A=\nB=",
    ["UNDOCUMENTED_KEY", "UNDOCUMENTED_KEY"],
    [0, 2, 0, 0, 2],
  ],
]) {
  test(`comparison handles ${name}`, () => {
    const result = analyzeConfig({ template, environment });
    assert.equal(result.comparison, "complete");
    assert.deepEqual(
      result.issues.map(({ code }) => code),
      expectedCodes,
    );
    const {
      templateKeys,
      environmentKeys,
      sharedKeys,
      missingKeys,
      undocumentedKeys,
    } = result.summary;
    assert.deepEqual(
      [
        templateKeys,
        environmentKeys,
        sharedKeys,
        missingKeys,
        undocumentedKeys,
      ],
      expectedCounts,
    );
  });
}

test("duplicate declarations do not inflate key counts or difference issues", () => {
  const result = analyzeConfig({
    template: "A=x\nA=y\nB=x",
    environment: "B=y\nB=z\nC=x\nC=y",
  });
  assert.equal(result.comparison, "complete");
  assert.deepEqual(result.summary, {
    errors: 0,
    warnings: 5,
    info: 0,
    total: 5,
    templateKeys: 2,
    environmentKeys: 2,
    sharedKeys: 1,
    missingKeys: 1,
    undocumentedKeys: 1,
  });
  assert.deepEqual(
    result.issues.map(({ code, key, source, location }) => [
      code,
      key,
      source,
      location.line,
    ]),
    [
      ["MISSING_KEY", "A", "template", 1],
      ["DUPLICATE_KEY", "A", "template", 2],
      ["DUPLICATE_KEY", "B", "environment", 2],
      ["UNDOCUMENTED_KEY", "C", "environment", 3],
      ["DUPLICATE_KEY", "C", "environment", 4],
    ],
  );
  assert.deepEqual(result.issues[1].relatedLocation, {
    file: ".env.example",
    line: 1,
  });
  assert.deepEqual(result.issues[4].relatedLocation, { file: ".env", line: 3 });
});

for (const role of ["template", "environment"]) {
  for (const [name, source, expectedCode] of [
    ["malformed syntax", "GOOD=x\ninvalid", "INVALID_DECLARATION"],
    [
      "unsupported multiline",
      'CREDENTIAL="first\nSYNTHETIC_BODY_SECRET=hidden\n"',
      "UNSUPPORTED_MULTILINE",
    ],
    [
      "unterminated quote",
      'CREDENTIAL="first\nSYNTHETIC_BODY_SECRET=hidden',
      "INVALID_DECLARATION",
    ],
  ]) {
    test(`${role} ${name} skips differences instead of producing misleading missing/undocumented keys`, () => {
      const input = {
        template: "EXPECTED=x",
        environment: "EXTRA=x",
        [role]: source,
      };
      const result = analyzeConfig(input);
      assert.equal(result.comparison, "skipped");
      assert.deepEqual(
        result.issues.map(({ code }) => code),
        [expectedCode, "COMPARISON_SKIPPED"],
      );
      assert.equal(result.issues[0].source, role);
      assert.equal(result.issues[0].severity, "error");
      assert.deepEqual(result.issues[1], {
        code: "COMPARISON_SKIPPED",
        severity: "info",
        message:
          "Key comparison was skipped because at least one input could not be parsed completely.",
        recommendation:
          "Resolve syntax errors and unsupported constructs in both inputs, then run the comparison again.",
        source: "comparison",
      });
      assert.equal(result.summary.sharedKeys, null);
      assert.equal(result.summary.missingKeys, null);
      assert.equal(result.summary.undocumentedKeys, null);
      assert.equal(result.summary.errors, 1);
      assert.equal(result.summary.info, 1);
      assert.equal(result.summary.total, 2);
      assert.ok(!JSON.stringify(result).includes("SYNTHETIC_BODY_SECRET"));
    });
  }
}

test("both invalid inputs retain every parser finding with explicit source roles", () => {
  const template = "A=x\nA=y\ninvalid\nB=x";
  const environment = "C=x\nC=y\ninvalid\nC=z";
  const report = analyzeConfig({
    template,
    environment,
    templateFile: "same.env",
    environmentFile: "same.env",
  });
  assert.deepEqual(
    report.issues.map(({ code, source, location }) => [
      code,
      source,
      location?.line,
    ]),
    [
      ["INVALID_DECLARATION", "template", 3],
      ["INVALID_DECLARATION", "environment", 3],
      ["DUPLICATE_KEY", "template", 2],
      ["DUPLICATE_KEY", "environment", 2],
      ["DUPLICATE_KEY", "environment", 4],
      ["COMPARISON_SKIPPED", "comparison", undefined],
    ],
  );
  for (const [source, text] of [
    ["template", template],
    ["environment", environment],
  ]) {
    for (const expected of parseDotenv(text, { file: "same.env" }).issues) {
      assert.ok(
        report.issues.some(
          ({ source: actualSource, ...issue }) =>
            actualSource === source &&
            JSON.stringify(issue) === JSON.stringify(expected),
        ),
      );
    }
  }
  assert.deepEqual(report.summary, {
    errors: 2,
    warnings: 3,
    info: 1,
    total: 6,
    templateKeys: 2,
    environmentKeys: 1,
    sharedKeys: null,
    missingKeys: null,
    undocumentedKeys: null,
  });
});

test("complete comparisons order findings by source and line rather than alphabet or discovery phase", () => {
  const report = analyzeConfig({
    template: "Z=x\nA=x\nZ=y",
    environment: "Y=x\nB=x\nY=y",
  });
  assert.deepEqual(
    report.issues.map(({ code, key, source, location }) => [
      code,
      key,
      source,
      location.line,
    ]),
    [
      ["MISSING_KEY", "Z", "template", 1],
      ["MISSING_KEY", "A", "template", 2],
      ["DUPLICATE_KEY", "Z", "template", 3],
      ["UNDOCUMENTED_KEY", "Y", "environment", 1],
      ["UNDOCUMENTED_KEY", "B", "environment", 2],
      ["DUPLICATE_KEY", "Y", "environment", 3],
    ],
  );
});

test("labels with spaces, Unicode, and Windows separators are metadata, including identical labels", () => {
  const label = "C:\\配置 folder\\.env";
  const report = analyzeConfig({
    template: "A=x\r\nA=y",
    environment: "B=x\nB=y",
    templateFile: label,
    environmentFile: label,
  });
  assert.deepEqual(
    report.issues.map(({ source }) => source),
    ["template", "template", "environment", "environment"],
  );
  assert.ok(report.issues.every(({ location }) => location.file === label));
  assert.equal(report.issues[1].relatedLocation.file, label);
});

test("key matching is case-sensitive and safe for prototype-like names", () => {
  const report = analyzeConfig({
    template: "__proto__=x\nconstructor=x\nport=x",
    environment: "__proto__=y\ntoString=x\nPORT=x",
  });
  assert.equal(report.summary.sharedKeys, 1);
  assert.deepEqual(
    report.issues.map(({ key }) => key),
    ["constructor", "port", "toString", "PORT"],
  );
});

test("messages and recommendations cover every stable code with actionable fixed text", () => {
  const complete = analyzeConfig({
    template: "MISSING=x\nDUPLICATE=x\nDUPLICATE=y",
    environment: "EXTRA=x",
  });
  const skipped = analyzeConfig({
    template: 'CREDENTIAL="first\nlast"\ninvalid',
    environment: "",
  });
  const issues = [...complete.issues, ...skipped.issues];
  assert.deepEqual(
    new Set(issues.map(({ code }) => code)),
    new Set(Object.values(ISSUE_CODES)),
  );
  const actions = {
    INVALID_DECLARATION: /NAME=value/,
    UNSUPPORTED_MULTILINE: /single-line/,
    DUPLICATE_KEY: /one declaration/,
    MISSING_KEY: /deployment environment/,
    UNDOCUMENTED_KEY: /reference template/,
    COMPARISON_SKIPPED: /Resolve syntax errors/,
  };
  for (const issue of issues) {
    assert.ok(issue.message.length > 0);
    assert.match(issue.recommendation, actions[issue.code]);
  }
});

test("public issue codes are stable and cannot be mutated", () => {
  const names = [
    "INVALID_DECLARATION",
    "UNSUPPORTED_MULTILINE",
    "DUPLICATE_KEY",
    "MISSING_KEY",
    "UNDOCUMENTED_KEY",
    "COMPARISON_SKIPPED",
  ];
  assert.deepEqual(Object.keys(ISSUE_CODES), names);
  for (const name of names) assert.equal(ISSUE_CODES[name], name);
  assert.ok(Object.isFrozen(ISSUE_CODES));
  assert.throws(() => {
    ISSUE_CODES.MISSING_KEY = "CHANGED";
  }, TypeError);
});

test("reports depend on declaration syntax and names, never assignment values", () => {
  const first = analyzeConfig({
    template: "A=first\nA=second\nB=",
    environment: "B=first\nC=second",
  });
  const second = analyzeConfig({
    template: "A=\"other\"\nA='changed'\nB=new",
    environment: "B=changed\nC=different",
  });
  assert.deepEqual(first, second);
  assert.deepEqual(JSON.parse(JSON.stringify(first)), first);
});

test("neither valid values nor invalid source text appear in reports or inspection output", () => {
  const secrets = [
    "SYNTHETIC_API_TOKEN",
    "SYNTHETIC_PASSWORD",
    "postgres://synthetic:password@host/db",
    "SYNTHETIC_RAW_LINE",
    "SYNTHETIC_BODY_SECRET",
  ];
  for (const template of [
    `TOKEN=${secrets[0]}\nTOKEN=${secrets[1]}\nDATABASE_URL=${secrets[2]}`,
    `${secrets[3]}\nCREDENTIAL="first\n${secrets[4]}=hidden\n"`,
  ]) {
    const result = analyzeConfig({
      template,
      environment: `PASSWORD=${secrets[1]}`,
    });
    for (const secret of secrets) {
      assert.ok(!JSON.stringify(result).includes(secret));
      assert.ok(
        !inspect(result, { depth: null, showHidden: true }).includes(secret),
      );
    }
  }
});

test("invalid input objects fail with a safe error", () => {
  for (const input of [
    undefined,
    null,
    [],
    "SYNTHETIC_SECRET",
    1,
    false,
    () => {},
  ]) {
    assert.throws(() => analyzeConfig(input), {
      name: "TypeError",
      message:
        "analyzeConfig requires an object with template and environment strings.",
    });
  }
});

test("required strings are not defaulted or coerced and errors do not repeat their values", () => {
  const malicious = {
    toString() {
      throw new Error("SYNTHETIC_COERCION_SECRET");
    },
  };
  for (const name of ["template", "environment"]) {
    for (const value of [
      undefined,
      null,
      1,
      [],
      {},
      Buffer.from("SYNTHETIC_SECRET"),
      Symbol("SYNTHETIC_SECRET"),
      malicious,
    ]) {
      assert.throws(
        () => analyzeConfig({ template: "", environment: "", [name]: value }),
        { name: "TypeError", message: `${name} must be a string.` },
      );
    }
  }
});

test("invalid file labels fail safely without accessing the filesystem", () => {
  for (const name of ["templateFile", "environmentFile"]) {
    for (const value of [null, "", 42, {}, Symbol("SYNTHETIC_SECRET")]) {
      assert.throws(
        () => analyzeConfig({ template: "", environment: "", [name]: value }),
        { name: "TypeError", message: `${name} must be a non-empty string.` },
      );
    }
  }
});

test("the parser size limit applies independently to both inputs", () => {
  for (const name of ["template", "environment"]) {
    assert.throws(
      () =>
        analyzeConfig({
          template: "",
          environment: "",
          [name]: "SYNTHETIC_SIZE_SECRET".padEnd(1_048_577, "x"),
        }),
      {
        name: "RangeError",
        message: "source exceeds the limit of 1,048,576 UTF-16 code units.",
      },
    );
  }
});

test("analysis is deterministic, leaves caller options untouched, and returns independent reports", () => {
  const input = Object.freeze({
    template: "A=x\nA=y",
    environment: "B=x",
    templateFile: "custom.example",
    toJSON() {
      throw new Error("Caller input must not be retained.");
    },
  });
  const first = analyzeConfig(input);
  const expected = JSON.parse(JSON.stringify(first));
  assert.deepEqual(analyzeConfig(input), expected);
  first.issues[0].location.line = 999;
  first.issues[1].recommendation = "changed";
  first.summary.errors = 999;
  assert.deepEqual(analyzeConfig(input), expected);
  assert.deepEqual(analyzeConfig({ template: "", environment: "" }).issues, []);
});
