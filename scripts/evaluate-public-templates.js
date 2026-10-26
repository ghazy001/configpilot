// Manual network-enabled evaluation of public examples, never part of runtime/CI.
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { TextDecoder } from "node:util";
import dotenv from "dotenv";
import { analyzeConfig, parseDotenv } from "../src/index.js";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const cli = fileURLToPath(new URL("../bin/configpilot.js", import.meta.url));
const manifest = JSON.parse(
  readFileSync(
    new URL("../docs/public-template-corpus.json", import.meta.url),
    "utf8",
  ),
);
const directory = mkdtempSync(join(tmpdir(), "configpilot public examples "));
try {
  for (const item of manifest) {
    assert.match(item.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
    assert.match(item.commit, /^[a-f0-9]{40}$/);
    assert.ok(
      item.path
        .split("/")
        .every((part) => part && part !== ".." && part !== "."),
    );
    const url = `https://raw.githubusercontent.com/${item.repository}/${item.commit}/${item.path}`;
    const response = await globalThis.fetch(url, {
      signal: globalThis.AbortSignal.timeout(30_000),
      redirect: "error",
    });
    assert.ok(response.ok);
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        assert.ok(bytes <= 1048576);
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    const raw = Buffer.concat(chunks);
    assert.equal(digest(raw), item.sha256);
    const text = new TextDecoder("utf8", { fatal: true }).decode(raw);
    const parsed = parseDotenv(text);
    const keys = [...new Set(parsed.declarations.map((d) => d.key))];
    const report = analyzeConfig({ template: text, environment: text });
    assert.deepEqual(
      analyzeConfig({ template: text, environment: text }),
      report,
    );
    assert.equal(report.comparison, "complete");
    assert.equal(report.summary.total, 0);
    const selected = join(directory, "public-template.txt");
    writeFileSync(selected, raw, { mode: 0o600 });
    const result = spawnSync(
      process.execPath,
      [cli, "check", `--template=${selected}`, `--env=${selected}`, "--json"],
      { cwd: directory, encoding: "utf8", timeout: 10000 },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(JSON.parse(result.stdout).summary.total, 0);
    assert.equal(digest(readFileSync(selected)), item.sha256);
    const marker = "SYNTHETIC_PUBLIC_EVALUATION_VALUE";
    const synthetic = keys.map((k) => `${k}=${marker}`).join("\n");
    assert.equal(
      analyzeConfig({ template: synthetic, environment: synthetic }).summary
        .total,
      0,
    );
    const extra = "CONFIGPILOT_EVALUATION_EXTRA";
    assert.ok(keys.length && !keys.includes(extra));
    const mutated = keys
      .slice(1)
      .map((k) => `${k}=${marker}`)
      .concat(`${extra}=${marker}`)
      .join("\n");
    const drift = analyzeConfig({ template: synthetic, environment: mutated });
    assert.equal(drift.summary.missingKeys, 1);
    assert.equal(drift.summary.undocumentedKeys, 1);
    assert.ok(!JSON.stringify(drift).includes(marker));
    const duplicate = analyzeConfig({
      template: synthetic,
      environment: synthetic + `\n${keys[0]}=${marker}`,
    });
    assert.deepEqual(
      duplicate.issues.map((i) => i.code),
      ["DUPLICATE_KEY"],
    );
    const referenceKeys = Object.keys(dotenv.parse(text)).sort();
    assert.deepEqual([...keys].sort(), referenceKeys);
    process.stdout.write(
      JSON.stringify({
        ...item,
        bytes,
        keys: keys.length,
        issues: parsed.issues.length,
        referenceKeyAgreement: true,
        cliExit: result.status,
        syntheticDrift: [1, 1],
        syntheticDuplicate: 1,
        unchanged: true,
      }) + "\n",
    );
  }
} catch {
  process.stderr.write(
    "Public-template evaluation failed. Check pinned sources, network, hashes and documented grammar; never attach configuration contents.\n",
  );
  process.exitCode = 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
