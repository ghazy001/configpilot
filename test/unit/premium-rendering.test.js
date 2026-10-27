import assert from "node:assert/strict";
import test from "node:test";
import { stripVTControlCharacters } from "node:util";
import { scanSource, classifyVariable } from "../../src/discovery/source.js";
import { analyzeConfig } from "../../src/index.js";
import {
  formatTerminal,
  terminalOptions,
} from "../../src/reporters/terminal.js";
import {
  formatDiscovery,
  formatInitializationPreview,
  formatInitializationSuccess,
  discoveryNextStep,
} from "../../src/reporters/discovery.js";
const name = "NEXT_PUBLIC_" + "LONG_".repeat(18) + "API_KEY";
const file = "src/配置/e\u0301/" + "long-directory/".repeat(14) + "server.ts";
const references = scanSource(
  `process.env.${name}; process.env.PORT ?? 3000; import.meta.env.DEV;`,
  { file },
).references;
const report = {
  schemaVersion: 1,
  kind: "discovery",
  complete: true,
  filesScanned: 24,
  bytesScanned: 200,
  variables: references.map((r) => ({
    name: r.name,
    ...classifyVariable(r.name, r.syntax),
    referenceCount: 1,
    references: [r],
    hasStaticFallback: r.hasStaticFallback,
    potentiallyRequired: !r.hasStaticFallback,
    inTemplate: true,
    inEnvironment: true,
  })),
  issues: [],
  configuration: {
    detected: [".env.example"],
    template: ".env.example",
    environment: null,
  },
};
function cells(line) {
  return [...line].reduce(
    (n, c) => n + (/\p{Mark}/u.test(c) ? 0 : /[配置]/u.test(c) ? 2 : 1),
    0,
  );
}
test("premium scan/init/check render at 40/60/80/120/160 columns without losing labels", () => {
  for (const width of [40, 60, 80, 120, 160])
    for (const color of [false, true]) {
      const options = { width, color, unicode: false };
      const renderings = [
        formatDiscovery(report, options),
        formatInitializationPreview(
          {
            report,
            content: "API_KEY=\nPORT=3000\n",
            output: ".env",
            ignore: "not-ignored",
            warnings: ["Keep configuration private."],
            exists: true,
          },
          options,
        ),
        formatInitializationSuccess(
          {
            output: ".env",
            publicTemplate: false,
            warnings: [],
            hasTemplate: true,
          },
          options,
        ),
        formatTerminal(
          analyzeConfig({ template: "A=\n", environment: "BROKEN" }),
          options,
        ),
      ];
      for (const output of renderings) {
        const plain = stripVTControlCharacters(output);
        for (const line of plain.split("\n"))
          assert.ok(
            cells(line) <= width,
            `${cells(line)} cells exceed ${width}`,
          );
        assert.ok(!plain.includes("\u001b"));
      }
      const plain = stripVTControlCharacters(renderings[0]).replace(/\s/g, "");
      assert.ok(plain.includes(name));
      assert.ok(plain.includes(file.replace(/\s/g, "")));
    }
});
test("status labels, locations and next steps remain useful without color", () => {
  const output = formatDiscovery(report);
  assert.match(output, /SCAN/);
  assert.match(output, /Discovered variables/);
  assert.match(output, /PUBLIC \+ SENSITIVE/);
  assert.match(output, /Framework-provided/);
  assert.match(output, /Static fallback observed/);
  assert.match(output, /Next Steps/);
  assert.equal(discoveryNextStep(report)[1], "configpilot init");
  assert.equal(
    discoveryNextStep({
      ...report,
      configuration: { ...report.configuration, environment: ".env" },
    })[1],
    "configpilot check",
  );
  assert.equal(
    discoveryNextStep({ ...report, complete: false })[1],
    "configpilot scan --verbose",
  );
  const dumb = terminalOptions(
    { isTTY: true, columns: 60 },
    { TERM: "dumb", FORCE_COLOR: "1", WT_SESSION: "synthetic" },
  );
  assert.equal(dumb.color, false);
  assert.equal(dumb.unicode, false);
  const colored = formatDiscovery(report, { color: true, unicode: true });
  assert.ok(colored.includes("\u001b[1;36m"));
  assert.ok(colored.includes("›"));
});
test("terminal details never mutate the structured check report", () => {
  const report = analyzeConfig({
    template: "TOKEN=",
    environment: "OTHER=SYNTHETIC_RENDER_SECRET",
  });
  const before = JSON.stringify(report);
  const text = formatTerminal(report, { color: true });
  assert.equal(JSON.stringify(report), before);
  assert.ok(!text.includes("SYNTHETIC_RENDER_SECRET"));
  assert.match(text, /MISSING_KEY/);
  assert.match(text, /UNDOCUMENTED_KEY/);
});
