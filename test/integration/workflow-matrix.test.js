import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
const cli = fileURLToPath(new URL("../../bin/configpilot.js", import.meta.url));
const scenarios = [
  { name: "A no config", source: "process.env.PORT", scan: 0, check: 2 },
  {
    name: "B template only",
    source: "process.env.PORT",
    template: "PORT=\nTEMPLATE_ONLY=\n",
    scan: 0,
    check: 2,
  },
  {
    name: "C local only",
    source: "process.env.PORT",
    local: "PORT=SYNTHETIC_SECRET\nLOCAL_ONLY=\n",
    scan: 0,
    check: 2,
  },
  {
    name: "D both files",
    source: "process.env.PORT",
    template: "PORT=\n",
    local: "PORT=SYNTHETIC_SECRET\n",
    scan: 0,
    check: 0,
  },
  { name: "E no references", source: "const x = 1;", scan: 0, check: 2 },
  {
    name: "F defaults",
    source: 'process.env.PORT ?? 3000; process.env.TOKEN || "SYNTHETIC_SECRET"',
    scan: 0,
    check: 2,
  },
  {
    name: "G externally provisioned",
    source: "process.env.EXTERNAL_KEY",
    template: "EXTERNAL_KEY=\n",
    local: "",
    scan: 0,
    check: 1,
  },
  {
    name: "H dynamic",
    source: "process.env[dynamicVariable]",
    scan: 0,
    check: 2,
  },
  {
    name: "I malformed config",
    source: "process.env.PORT",
    template: "BROKEN",
    scan: 1,
    check: 2,
  },
  {
    name: "J protected existing file",
    source: "process.env.PORT",
    local: "PORT=SYNTHETIC_SECRET\n",
    scan: 0,
    check: 2,
  },
];
for (const scenario of scenarios)
  test(`workflow matrix: ${scenario.name}`, (t) => {
    const root = mkdtempSync(join(tmpdir(), "configpilot matrix é "));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    writeFileSync(join(root, "server.js"), scenario.source);
    if (scenario.template !== undefined)
      writeFileSync(join(root, ".env.example"), scenario.template);
    if (scenario.local !== undefined)
      writeFileSync(join(root, ".env"), scenario.local);
    const run = (args) => {
      const r = spawnSync(process.execPath, [cli, ...args], {
        cwd: root,
        encoding: "utf8",
        timeout: 15000,
        env: {
          ...process.env,
          CI: "true",
          NO_COLOR: "1",
          EXTERNAL_KEY: "SYNTHETIC_PROCESS_SECRET",
        },
      });
      assert.ifError(r.error);
      assert.equal(r.signal, null);
      assert.ok(!r.stdout.includes("SYNTHETIC_SECRET"));
      assert.ok(!r.stderr.includes("SYNTHETIC_SECRET"));
      assert.ok(!r.stdout.includes("SYNTHETIC_PROCESS_SECRET"));
      return r;
    };
    assert.equal(run(["scan", "--json"]).status, scenario.scan);
    assert.equal(
      run(["init", "--dry-run", "--json"]).status,
      scenario.scan === 1 ? 2 : 0,
    );
    const before = existsSync(join(root, ".env"))
      ? readFileSync(join(root, ".env"))
      : null;
    const unapproved = run(["init"]);
    assert.ok([0, 2].includes(unapproved.status));
    if (before) assert.deepEqual(readFileSync(join(root, ".env")), before);
    else assert.ok(!existsSync(join(root, ".env")));
    assert.equal(run(["check", "--json"]).status, scenario.check);
    if (
      scenario.scan === 0 &&
      scenario.name !== "E no references" &&
      scenario.name !== "H dynamic"
    ) {
      if (!existsSync(join(root, ".env.example")))
        assert.equal(run(["init", "--template", "--yes"]).status, 0);
      if (!existsSync(join(root, ".env")))
        assert.equal(run(["init", "--yes"]).status, 0);
      if (scenario.name !== "G externally provisioned")
        assert.equal(run(["check", "--json"]).status, 0);
    }
  });
