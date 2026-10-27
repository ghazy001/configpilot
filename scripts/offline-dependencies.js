// Test/acceptance helper. Preseed installed pinned parser dependencies without network.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
// The reviewed runtime graph is flat; fail rather than silently seed a nested or
// linked dependency incorrectly. Read package metadata only; never execute it.
export const parserDependencies = Object.entries(lock.packages)
  .filter(
    ([path, metadata]) => path.startsWith("node_modules/") && !metadata.dev,
  )
  .map(([path]) => {
    const name = path.slice("node_modules/".length);
    if (name.includes("/node_modules/"))
      throw new Error("Nested offline dependency requires review.");
    return name;
  });
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
