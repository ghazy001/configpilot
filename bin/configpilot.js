#!/usr/bin/env node

import { readFileSync } from "node:fs";
import process from "node:process";
import { confirmCreation } from "../src/initialization/confirm.js";
import { URL } from "node:url";
import { cliFailure, runCli } from "../src/cli.js";

import { terminalOptions } from "../src/reporters/terminal.js";

// A closed output pipe should not produce an uncaught stack trace.
for (const stream of [process.stdout, process.stderr]) {
  stream.on("error", (error) => {
    if (error.code !== "EPIPE") process.exitCode = 2;
  });
}

const args = process.argv.slice(2);
let result;
try {
  const { version } = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  result = await runCli(args, {
    version,
    interactive: Boolean(
      process.stdin.isTTY &&
      process.stdout.isTTY &&
      !process.env.CI &&
      !process.env.GITHUB_ACTIONS &&
      !process.env.TF_BUILD,
    ),
    confirm: confirmCreation,
    display: {
      stdout: terminalOptions(process.stdout, process.env),
      stderr: terminalOptions(process.stderr, process.env),
    },
  });
} catch {
  result = cliFailure(
    "INTERNAL_ERROR",
    ["check", "scan", "init"].includes(args[0]) && args.includes("--json"),
  );
}

if (process.exitCode !== 2) process.exitCode = result.exitCode;
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
