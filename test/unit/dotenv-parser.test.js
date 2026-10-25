import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { inspect } from "node:util";
import test from "node:test";
import { parseDotenv } from "../../src/index.js";

const location = (line, file = "<input>") => ({ file, line });
const declaration = (key, line, file) => ({
  key,
  location: location(line, file),
});

for (const [name, source, expected] of [
  ["empty input", "", []],
  ["blank lines and comments", "\n \t\n # ignored=example\n\t# comment", []],
  [
    "empty values",
    "EMPTY=\nSPACE= \t\nCOMMENT=# ignored",
    [
      ["EMPTY", 1],
      ["SPACE", 2],
      ["COMMENT", 3],
    ],
  ],
  [
    "portable names",
    "A=value\n_lower2=value\nexport=value\nExport=value",
    [
      ["A", 1],
      ["_lower2", 2],
      ["export", 3],
      ["Export", 4],
    ],
  ],
  [
    "export and whitespace",
    " \texport\t API_TOKEN \t= value\n\tPORT = 3000 ",
    [
      ["API_TOKEN", 1],
      ["PORT", 2],
    ],
  ],
  [
    "equals signs and hashes",
    "URL=https://example.test/?a=b=c#ignored\nHASH='a#b=c' # comment",
    [
      ["URL", 1],
      ["HASH", 2],
    ],
  ],
  [
    "all quote styles",
    "SINGLE='example'\nDOUBLE=\"example\"\nBACKTICK=`example`\nEMPTY=''",
    [
      ["SINGLE", 1],
      ["DOUBLE", 2],
      ["BACKTICK", 3],
      ["EMPTY", 4],
    ],
  ],
  [
    "unquoted embedded quotes and Unicode",
    'JSON={"message":"café"}\nTEXT=hello world\nAPOSTROPHE=it\'s literal',
    [
      ["JSON", 1],
      ["TEXT", 2],
      ["APOSTROPHE", 3],
    ],
  ],
  [
    "literal escapes and expansion syntax",
    String.raw`QUOTED="line\nvalue\t${"${OTHER}"}"` +
      "\nREFERENCE=${OTHER}\nCOMMAND=$(whoami)",
    [
      ["QUOTED", 1],
      ["REFERENCE", 2],
      ["COMMAND", 3],
    ],
  ],
  ["initial BOM", "\uFEFF# comment\nKEY=value", [["KEY", 2]]],
  [
    "Unix line endings",
    "A=x\n\nB=y\n",
    [
      ["A", 1],
      ["B", 3],
    ],
  ],
  [
    "Windows line endings",
    "A=x\r\n\r\nB=y\r\n",
    [
      ["A", 1],
      ["B", 3],
    ],
  ],
  [
    "carriage returns",
    "A=x\r\rB=y\r",
    [
      ["A", 1],
      ["B", 3],
    ],
  ],
]) {
  test(`supported syntax: ${name}`, () => {
    assert.deepEqual(parseDotenv(source), {
      declarations: expected.map(([key, line]) => declaration(key, line)),
      issues: [],
    });
  });
}

test("escaped quotes and backslashes do not terminate a quoted value early", () => {
  const source = [
    String.raw`DOUBLE="escaped \"quote\" and slash \\" # ignored`,
    String.raw`SINGLE='escaped \'quote\' and slash \\'`,
    "BACKTICK=`escaped \\`quote\\` and slash \\\\`",
  ].join("\n");
  assert.deepEqual(parseDotenv(source), {
    declarations: [
      declaration("DOUBLE", 1),
      declaration("SINGLE", 2),
      declaration("BACKTICK", 3),
    ],
    issues: [],
  });
});

for (const [name, source] of [
  ["missing equals", "NOT_AN_ASSIGNMENT"],
  ["missing name", "=example"],
  ["leading digit", "1_KEY=example"],
  ["hyphenated name", "BAD-KEY=example"],
  ["dotted name", "BAD.KEY=example"],
  ["Unicode name", "CLÉ=example"],
  ["colon assignment", "KEY: example"],
  ["missing export assignment", "export KEY"],
  ["case-sensitive export prefix", "EXPORT KEY=example"],
  ["trailing text", 'KEY="example" trailing'],
  ["concatenated quotes", "KEY=\"example\"'other'"],
  ["quoted shell suffix", 'KEY="example"; echo unwanted'],
  ["NUL in value", "KEY=before\0after"],
  ["NUL in comment", "# comment\0example"],
  ["BOM inside input", "\n\uFEFFKEY=value"],
]) {
  test(`invalid syntax: ${name}`, () => {
    const result = parseDotenv(source);
    assert.deepEqual(result.declarations, []);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].code, "INVALID_DECLARATION");
    assert.equal(result.issues[0].severity, "error");
    assert.ok(!Object.hasOwn(result.issues[0], "key"));
    assert.equal(typeof result.issues[0].recommendation, "string");
  });
}

test("invalid declarations recover at the next independent line", () => {
  const result = parseDotenv(
    'BAD-KEY=value\nGOOD=value\nQUOTED="ok" trailing\nNEXT=value',
  );
  assert.deepEqual(result.declarations, [
    declaration("GOOD", 2),
    declaration("NEXT", 4),
  ]);
  assert.deepEqual(
    result.issues.map(({ code, location }) => [code, location.line]),
    [
      ["INVALID_DECLARATION", 1],
      ["INVALID_DECLARATION", 3],
    ],
  );
});

test("duplicates retain every occurrence and point to the first valid declaration", () => {
  const result = parseDotenv(
    'PORT="bad" suffix\nPORT=one\nPORT=two\nPORT=three\nport=four',
    { file: "配置 folder/.env" },
  );
  assert.deepEqual(result.declarations, [
    declaration("PORT", 2, "配置 folder/.env"),
    declaration("PORT", 3, "配置 folder/.env"),
    declaration("PORT", 4, "配置 folder/.env"),
    declaration("port", 5, "配置 folder/.env"),
  ]);
  assert.deepEqual(
    result.issues
      .slice(1)
      .map(({ code, severity, key, location, relatedLocation }) => ({
        code,
        severity,
        key,
        location,
        relatedLocation,
      })),
    [3, 4].map((line) => ({
      code: "DUPLICATE_KEY",
      severity: "warning",
      key: "PORT",
      location: location(line, "配置 folder/.env"),
      relatedLocation: location(2, "配置 folder/.env"),
    })),
  );
});

test("prototype-like names are ordinary keys", () => {
  const result = parseDotenv(
    "__proto__=one\nconstructor=two\ntoString=three\n__proto__=four",
  );
  assert.deepEqual(
    result.declarations.map(({ key }) => key),
    ["__proto__", "constructor", "toString", "__proto__"],
  );
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].key, "__proto__");
  assert.deepEqual(result.issues[0].relatedLocation, location(1));
});

for (const quote of ["'", '"', "`"]) {
  test(`multiline ${quote} values are rejected without exposing body declarations`, () => {
    const result = parseDotenv(
      `BEFORE=x\nCREDENTIAL=${quote}first\nSYNTHETIC_BODY_SECRET=hidden\n${quote} trailing ignored\nAFTER=x`,
    );
    assert.deepEqual(result.declarations, [
      declaration("BEFORE", 1),
      declaration("AFTER", 5),
    ]);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].code, "UNSUPPORTED_MULTILINE");
    assert.deepEqual(result.issues[0].location, location(2));
    assert.ok(!JSON.stringify(result).includes("SYNTHETIC_BODY_SECRET"));
  });

  test(`unclosed ${quote} values suppress the remaining input`, () => {
    const result = parseDotenv(
      `BEFORE=x\nCREDENTIAL=${quote}first\nSYNTHETIC_BODY_SECRET=hidden\nAFTER=x`,
    );
    assert.deepEqual(result.declarations, [declaration("BEFORE", 1)]);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].code, "INVALID_DECLARATION");
    assert.ok(!JSON.stringify(result).includes("SYNTHETIC_BODY_SECRET"));
    assert.equal(
      parseDotenv(`KEY=${quote}unterminated`).issues[0].code,
      "INVALID_DECLARATION",
    );
  });
}

for (const prefix of [
  'BAD-KEY="first',
  'MISSING_EQUALS "first',
  'KEY="ok" trailing="first',
  'KEY=bad\0 "first',
]) {
  test(`malformed quoted blocks are quarantined: ${JSON.stringify(prefix)}`, () => {
    const result = parseDotenv(
      `${prefix}\nSYNTHETIC_BODY_SECRET=hidden\n"\nAFTER=value`,
    );
    assert.deepEqual(result.declarations, [declaration("AFTER", 4)]);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].code, "INVALID_DECLARATION");
    assert.ok(!JSON.stringify(result).includes("SYNTHETIC_BODY_SECRET"));
  });
}

test("comments and closed quote pairs in malformed lines do not swallow later declarations", () => {
  const result = parseDotenv('BAD "closed" # unmatched "\nGOOD=value');
  assert.deepEqual(result.declarations, [declaration("GOOD", 2)]);
  assert.equal(result.issues.length, 1);
});

test("escaped delimiters inside multiline bodies do not end quarantine", () => {
  const source =
    'KEY="first\n\\"\nSYNTHETIC_BODY_SECRET=hidden\n"\nAFTER=value';
  const result = parseDotenv(source);
  assert.deepEqual(result.declarations, [declaration("AFTER", 5)]);
  assert.equal(result.issues[0].code, "UNSUPPORTED_MULTILINE");
  assert.ok(!JSON.stringify(result).includes("SYNTHETIC_BODY_SECRET"));
});

test("results and diagnostic text do not retain values or raw invalid lines", () => {
  const secrets = [
    "SYNTHETIC_API_TOKEN",
    "SYNTHETIC_PASSWORD",
    "postgres://synthetic:password@host/db",
    "SYNTHETIC_RAW_LINE",
    "SYNTHETIC_BODY_SECRET",
  ];
  const source = `TOKEN=${secrets[0]}\nPASSWORD='${secrets[1]}'\nURL=${secrets[2]}\n${secrets[3]}\nKEY="ok" ${secrets[1]}\nCREDENTIAL="first\n${secrets[4]}=body\n"\nTOKEN=another`;
  const result = parseDotenv(source, { file: ".env.test" });
  for (const secret of secrets) {
    assert.ok(!JSON.stringify(result).includes(secret));
    assert.ok(
      !inspect(result, { showHidden: true, depth: null }).includes(secret),
    );
  }
  for (const entry of result.declarations) {
    assert.deepEqual(Object.keys(entry).sort(), ["key", "location"]);
  }
});

test("invalid source arguments are rejected without coercion or value disclosure", () => {
  const malicious = {
    toString() {
      throw new Error("SYNTHETIC_COERCION_SECRET");
    },
  };
  for (const source of [
    undefined,
    null,
    42,
    true,
    Symbol("SYNTHETIC_SECRET"),
    {},
    [],
    Buffer.from("SYNTHETIC_SECRET"),
    malicious,
  ]) {
    assert.throws(() => parseDotenv(source), {
      name: "TypeError",
      message: "source must be a string.",
    });
  }
});

test("invalid options fail with fixed safe messages", () => {
  for (const options of [null, [], "SYNTHETIC_SECRET", 1, () => {}]) {
    assert.throws(() => parseDotenv("KEY=SYNTHETIC_SECRET", options), {
      name: "TypeError",
      message: "options must be an object.",
    });
  }
  for (const file of [null, "", 1, {}, Symbol("SYNTHETIC_SECRET")]) {
    assert.throws(() => parseDotenv("KEY=SYNTHETIC_SECRET", { file }), {
      name: "TypeError",
      message: "options.file must be a non-empty string.",
    });
  }
});

test("documented size limit is inclusive and excessive input raises a safe error", () => {
  assert.deepEqual(parseDotenv("#".padEnd(1_048_576, "x")), {
    declarations: [],
    issues: [],
  });
  assert.throws(
    () => parseDotenv("SYNTHETIC_SIZE_SECRET".padEnd(1_048_577, "x")),
    {
      name: "RangeError",
      message: "source exceeds the limit of 1,048,576 UTF-16 code units.",
    },
  );
});

test("parsing is deterministic, does not mutate options, and keeps no cross-call state", () => {
  const options = Object.freeze({ file: "source.env" });
  const source = "A=one\nA=two\ninvalid";
  const first = parseDotenv(source, options);
  const expected = JSON.parse(JSON.stringify(first));
  assert.deepEqual(parseDotenv(source, options), expected);
  first.declarations[0].key = "CHANGED";
  first.issues[0].relatedLocation.line = 999;
  assert.deepEqual(parseDotenv(source, options), expected);
  assert.deepEqual(parseDotenv("A=value").issues, []);
});

test("malformed closing lines cannot expose a second quoted credential block", () => {
  const result = parseDotenv(
    "KEY=\"first\n\" trailing='second\nSYNTHETIC_CHAINED_SECRET=hidden\n'\nAFTER=value",
  );
  assert.deepEqual(result.declarations, [declaration("AFTER", 5)]);
  assert.equal(result.issues.length, 1);
  assert.ok(!JSON.stringify(result).includes("SYNTHETIC_CHAINED_SECRET"));
});

test("an unclosed chained block suppresses the rest of the input", () => {
  const result = parseDotenv(
    'KEY="first\n" trailing=\'second\nSYNTHETIC_CHAINED_SECRET=hidden',
  );
  assert.deepEqual(result.declarations, []);
  assert.equal(result.issues[0].code, "INVALID_DECLARATION");
  assert.ok(!JSON.stringify(result).includes("SYNTHETIC_CHAINED_SECRET"));
});
