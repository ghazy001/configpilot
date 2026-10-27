import assert from "node:assert/strict";
import test from "node:test";
import { stripVTControlCharacters } from "node:util";
import { scanVueSource } from "../../src/discovery/vue.js";
import { textWidth, formatTerminal } from "../../src/reporters/terminal.js";
import {
  formatWorkspaces,
  formatTemplateUpdates,
} from "../../src/reporters/project.js";
import { analyzeConfigWithRules } from "../../src/project/check.js";
import { formatGithub } from "../../src/reporters/github.js";

test("project displays align and remain readable at 40/60/80/120/160 columns in color and monochrome", () => {
  const policy = analyzeConfigWithRules(
    { template: "TOKEN=", environment: "TOKEN=" },
    { requiredKeys: ["TOKEN"] },
  );
  for (const width of [40, 60, 80, 120, 160])
    for (const color of [false, true]) {
      const style = { width, color, unicode: true };
      const outputs = [
        formatTerminal(
          {
            ...policy.analysis,
            issues: policy.issues,
            summary: { ...policy.analysis.summary, ...policy.summary },
          },
          { ...style, policyReport: true },
        ),
        formatTemplateUpdates(
          {
            keys: ["LONG_" + "A".repeat(120)],
            template: "src/" + "directory/".repeat(30) + ".env.example",
          },
          style,
        ),
        formatWorkspaces(
          {
            workspaces: [
              {
                name: "backend",
                root: "apps/設定 api",
                exitCode: 1,
                report: policy,
              },
              {
                name: "preview",
                root: "apps/web",
                exitCode: 0,
                report: { kind: "template-diff", keys: ["NEW_KEY"] },
              },
            ],
          },
          style,
        ),
      ];
      for (const output of outputs) {
        assert.ok(output.includes("ConfigPilot"));
        for (const row of output.trimEnd().split("\n"))
          assert.ok(
            textWidth(stripVTControlCharacters(row)) <= width,
            `${width}: ${row}`,
          );
        if (!color) assert.ok(!output.includes("\u001b"));
      }
    }
});

test("Vue boundaries ignore comments/strings/custom blocks and expose explicit unresolved or unsupported scopes", () => {
  const result = scanVueSource(
    '<!-- <script>process.env.FALSE</script> -->\r\n<template><b :title="process.env.TEMPLATE">{{name}}</b></template>\r\n<script lang="ts">\r\nconst env=process.env; env.API_KEY; const s="process.env.STRING";\r\n</script>\r\n<custom>process.env.CUSTOM</custom>',
    { file: "設定.vue" },
  );
  assert.deepEqual(
    result.references.map((r) => r.name),
    ["API_KEY"],
  );
  assert.equal(result.references[0].location.line, 4);
  assert.equal(result.references[0].location.file, "設定.vue");
  assert.equal(result.issues[0].code, "SOURCE_DYNAMIC_REFERENCE");
  const staticTemplate = scanVueSource("<template><b>constant</b></template>", {
    file: "Empty.vue",
  });
  assert.deepEqual(staticTemplate, { references: [], issues: [] });
  for (const input of [
    '<script>invalid syntax const = "SYNTHETIC_SECRET"</script>',
    '<script setup lang="coffee">x</script>',
    '<template src="private.html"></template>',
    '<script src="private.js"></script>',
    "<script>a()</script><script setup>b()</script>",
    "<template><b></template>",
  ]) {
    const failed = scanVueSource(input, { file: "Broken.vue" });
    assert.ok(failed.issues.some((i) => i.code === "SOURCE_PARSE_ERROR"));
    assert.ok(!JSON.stringify(failed).includes("SYNTHETIC_SECRET"));
  }
  const emptyRoot = scanVueSource("<script></script>", { file: "Empty.vue" });
  assert.equal(emptyRoot.issues[0].code, "SOURCE_PARSE_ERROR");
});

test("annotation locations omit absolute, traversing or unsafe metadata, with deterministic capped output", () => {
  for (const file of [
    "/private/config.env",
    "C:\\outside.env",
    "../outside.env",
    "src/../../outside.env",
    "a\n::error::",
  ]) {
    const result = formatGithub({
      kind: "workspaces",
      workspaces: [
        {
          root: "apps/api",
          report: {
            issues: [
              {
                code: "MISSING_KEY",
                severity: "error",
                key: "TOKEN",
                location: { file, line: 1 },
              },
            ],
          },
        },
      ],
    });
    assert.ok(!result.includes(",file="));
    assert.equal(result.trim().split("\n").length, 1);
  }
  const r = formatGithub({
    issues: [
      {
        code: "MISSING_KEY",
        key: "TOKEN",
        severity: "info",
        location: { file: "src/a,b%:.js", line: 2 },
      },
    ],
  });
  assert.match(r, /^::notice/);
  assert.match(r, /file=src\/a%2Cb%25%3A.js,line=2/);
});

test("policy success and workspace failures never misstate key equality or error counts", () => {
  const report = analyzeConfigWithRules(
    { template: "A=", environment: "" },
    { severity: { MISSING_KEY: "off" } },
  );
  const text = formatTerminal(
    {
      ...report.analysis,
      issues: report.issues,
      summary: { ...report.analysis.summary, ...report.summary },
    },
    { policyReport: true },
  );
  assert.match(text, /No active project-policy findings/);
  assert.ok(!text.includes("Syntax and declared keys match"));
  const empty = formatTemplateUpdates({ keys: [], template: null });
  assert.ok(!empty.includes("up to date"));
  const failed = formatWorkspaces({
    workspaces: [
      {
        name: "broken",
        root: "apps/api",
        exitCode: 2,
        report: {
          error: {
            code: "FILE_NOT_FOUND",
            message: "Selected input is absent.",
          },
        },
      },
    ],
  });
  assert.match(failed, /FAILED/);
  assert.match(failed, /FILE_NOT_FOUND/);
  const compact = failed.replace(/\s+/g, " ");
  assert.match(compact, /\| 1 \|/);
});

test("annotation caps prioritize errors across all workspaces instead of hiding them behind informational findings", () => {
  const text = formatGithub({
    kind: "workspaces",
    workspaces: [
      {
        root: "apps/a",
        report: {
          issues: Array(210).fill({
            code: "SOURCE_DYNAMIC_REFERENCE",
            severity: "info",
          }),
        },
      },
      {
        root: "apps/b",
        report: {
          issues: [
            { code: "EMPTY_REQUIRED_KEY", key: "API_TOKEN", severity: "error" },
          ],
        },
      },
    ],
  });
  assert.match(text, /^::error /);
  assert.match(text.split("\n")[0], /API_TOKEN/);
  assert.equal(text.trim().split("\n").length, 201);
});

test("external rules suppress local-presence concern without hiding template or public-secret guidance", async () => {
  const { formatDiscovery } = await import("../../src/reporters/discovery.js");
  const variable = {
    name: "DEPLOYMENT_ID",
    category: "Unknown",
    purpose: "Unknown",
    confidence: "low",
    potentiallySensitive: false,
    frameworkProvided: false,
    referenceCount: 1,
    references: [
      {
        name: "DEPLOYMENT_ID",
        location: { file: "app.js", line: 1 },
        syntax: "process.env",
        notation: "dot",
        hasStaticFallback: false,
      },
    ],
    hasStaticFallback: false,
    potentiallyRequired: true,
    inTemplate: false,
    inEnvironment: false,
    configurationRole: "external",
  };
  const report = {
    schemaVersion: 1,
    kind: "discovery",
    complete: true,
    filesScanned: 1,
    bytesScanned: 20,
    variables: [variable],
    issues: [],
    configuration: {
      template: ".env.example",
      environment: ".env",
      detected: [".env.example", ".env"],
    },
  };
  const external = formatDiscovery(report);
  assert.match(external, /Needs review/);
  assert.match(external, /Document this key/);
  assert.ok(!external.includes("No local declaration"));
  const sensitive = formatDiscovery({
    ...report,
    variables: [
      {
        ...variable,
        name: "NEXT_PUBLIC_TOKEN",
        category: "Public frontend configuration",
        potentiallySensitive: true,
        inTemplate: true,
      },
    ],
  });
  assert.match(sensitive, /Keep credentials server-side/);
});
