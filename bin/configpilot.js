#!/usr/bin/env node

import { readFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { cliFailure, runCli } from "../src/cli.js";

const args = process.argv.slice(2);
let result;
try {
  const { version } = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  result = await runCli(args, { version });
} catch {
  result = cliFailure(
    "INTERNAL_ERROR",
    args[0] === "check" && args.includes("--json"),
  );
}

// A closed output pipe should not produce an uncaught stack trace.
for (const stream of [process.stdout, process.stderr]) {
  stream.on("error", (error) => {
    if (error.code !== "EPIPE") process.exitCode = 2;
  });
}
process.exitCode = result.exitCode;
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
