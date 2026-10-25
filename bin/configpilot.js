#!/usr/bin/env node

import { readFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { runCli } from "../src/cli.js";

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const result = runCli(process.argv.slice(2), { version });

process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exitCode = result.exitCode;
