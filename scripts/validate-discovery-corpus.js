// Explicit local public-source validation; never imports or executes selected code.
import console from "node:console";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { scanProject, generateEnvTemplate } from "../src/index.js";
const expected = {
  Node: ["PORT"],
  Express: [],
  Vite: [],
  "Next.js": ["NEXT_PUBLIC_API_URL"],
  "TypeScript backend": ["PORT"],
};
const cli = fileURLToPath(new URL("../bin/configpilot.js", import.meta.url));
if (process.argv[2] === "--probe") {
  const start = performance.now();
  const report = await scanProject({ root: process.argv[3] });
  console.log(
    JSON.stringify({
      report,
      elapsedMs: Math.round((performance.now() - start) * 100) / 100,
      maxRssMiB:
        Math.round((process.resourceUsage().maxRSS / 1024) * 100) / 100,
    }),
  );
} else {
  const projects = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const results = [];
  for (const project of projects) {
    const run = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), "--probe", project.root],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(run.status, 0, run.stderr);
    const { report, elapsedMs, maxRssMiB } = JSON.parse(run.stdout);
    const names = report.variables.map((v) => v.name);
    assert.deepEqual(names, expected[project.kind]);
    assert.equal(report.complete, true);
    const cliRun = (args) => {
      const r = spawnSync(process.execPath, [cli, ...args], {
        cwd: project.root,
        encoding: "utf8",
        timeout: 30000,
        env: { ...process.env, NO_COLOR: "1" },
      });
      assert.equal(r.status, 0, r.stderr);
      return r;
    };
    assert.deepEqual(JSON.parse(cliRun(["scan", "--json"]).stdout), report);
    const content = generateEnvTemplate(report);
    const preview = JSON.parse(cliRun(["init", "--dry-run", "--json"]).stdout);
    assert.equal(preview.content, content);
    let onboarding = "no variables; no file created";
    if (content) {
      cliRun(["init", "--template", "--yes"]);
      cliRun(["init", "--yes"]);
      const checked = JSON.parse(cliRun(["check", "--json"]).stdout);
      assert.equal(checked.summary.total, 0);
      assert.equal(readFileSync(join(project.root, ".env"), "utf8"), content);
      unlinkSync(join(project.root, ".env"));
      unlinkSync(join(project.root, ".env.example"));
      onboarding = "template/local/check passed";
    }
    results.push({
      kind: project.kind,
      repository: project.repository,
      commit: project.commit,
      files: project.files,
      filesScanned: report.filesScanned,
      references: report.variables.reduce((n, v) => n + v.referenceCount, 0),
      names,
      observedFalsePositives: 0,
      observedFalseNegatives: 0,
      elapsedMs,
      maxRssMiB,
      generatedBytes: content.length,
      onboarding,
    });
  }
  writeFileSync(
    process.argv[4] ?? "/private/tmp/configpilot-discovery-corpus-results.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results));
}
