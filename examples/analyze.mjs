import { readFile } from "node:fs/promises";
import process from "node:process";
import { URL } from "node:url";
import { analyzeConfig } from "configpilot";

// The caller reads these known synthetic fixtures. The public API only receives
// explicit strings and public source labels, and performs no filesystem access.
const template = await readFile(
  new URL("./reference.txt", import.meta.url),
  "utf8",
);
const environment = await readFile(
  new URL("./environment.txt", import.meta.url),
  "utf8",
);
const report = analyzeConfig({
  template,
  environment,
  templateFile: "examples/reference.txt",
  environmentFile: "examples/environment.txt",
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
