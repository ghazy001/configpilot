// Test/acceptance helper. Preseed installed pinned parser dependencies without network.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
export const parserDependencies = [
  "@babel/parser",
  "@babel/types",
  "@babel/helper-string-parser",
  "@babel/helper-validator-identifier",
];
export function seedOfflineDependencies(consumer) {
  const metadata = JSON.parse(
    readFileSync(join(consumer, "package.json"), "utf8"),
  );
  metadata.dependencies = {
    ...metadata.dependencies,
    ...Object.fromEntries(
      parserDependencies.map((name) => [
        name,
        `file:${join(root, "node_modules", name)}`,
      ]),
    ),
  };
  writeFileSync(join(consumer, "package.json"), JSON.stringify(metadata));
  for (const name of parserDependencies) {
    const destination = join(consumer, "node_modules", name);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(root, "node_modules", name), destination, { recursive: true });
  }
}
