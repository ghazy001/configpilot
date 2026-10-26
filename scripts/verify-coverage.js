import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export function coreCoveragePassed(files, directory = root) {
  if (!Array.isArray(files)) return false;
  return [
    "src/parser/dotenv-parser.js",
    "src/analyzer/config-analyzer.js",
  ].every((path) => {
    const file = files.find(
      (entry) =>
        typeof entry?.path === "string" &&
        resolve(entry.path) === resolve(directory, path),
    );
    return [file?.coveredLinePercent, file?.coveredBranchPercent].every(
      (value) =>
        typeof value === "number" && Number.isFinite(value) && value >= 90,
    );
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = mkdtempSync(join(tmpdir(), "configpilot coverage "));
  try {
    const report = join(directory, "coverage.json");
    const result = spawnSync(
      process.execPath,
      [
        "--test",
        "--experimental-test-coverage",
        "--test-reporter=tap",
        "--test-reporter-destination=stdout",
        `--test-reporter=${new URL("./coverage-reporter.js", import.meta.url).href}`,
        `--test-reporter-destination=${report}`,
      ],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        timeout: 120_000,
      },
    );
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    if (
      result.error ||
      result.status !== 0 ||
      !coreCoveragePassed(JSON.parse(readFileSync(report, "utf8")))
    )
      throw new Error();
  } catch {
    process.stderr.write(
      "Coverage verification requires successful tests and at least 90% parser/analyzer lines and branches.\n",
    );
    process.exitCode = 1;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
