import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { candidateFiles, verifyPack } from "./release-guards.js";

const root = fileURLToPath(new URL("../", import.meta.url));
let created;
try {
  if (process.argv.length !== 3 || !process.env.npm_execpath) throw new Error();
  const selected = resolve(process.argv[2]);
  const destination = join(realpathSync(dirname(selected)), basename(selected));
  const fromRoot = relative(realpathSync(root), destination);
  if (
    !isAbsolute(fromRoot) &&
    fromRoot !== ".." &&
    !fromRoot.startsWith(`..${sep}`)
  )
    throw new Error();
  const metadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const expected = candidateFiles(metadata);
  for (const file of expected) {
    const info = lstatSync(join(root, file));
    if (!info.isFile() || info.isSymbolicLink()) throw new Error();
  }
  const revision = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  });
  if (revision.status !== 0 || !/^[a-f0-9]{40}$/.test(revision.stdout.trim()))
    throw new Error();
  const commit = revision.stdout.trim();
  const tracked = spawnSync(
    "git",
    ["ls-files", "--error-unmatch", "--", ...expected],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  if (tracked.status !== 0) throw new Error();
  // Status/diff can hide edits behind local index flags. Bind every shipped byte
  // to the claimed commit independently of assume-unchanged/skip-worktree.
  for (const file of expected) {
    const committed = spawnSync("git", ["show", `${commit}:${file}`], {
      cwd: root,
      timeout: 10_000,
      maxBuffer: 16 * 1024 * 1024,
    });
    if (
      committed.error ||
      committed.status !== 0 ||
      !committed.stdout.equals(readFileSync(join(root, file)))
    )
      throw new Error();
  }
  const status = spawnSync(
    "git",
    ["status", "--porcelain", "--untracked-files=normal"],
    {
      cwd: root,
      encoding: "utf8",
    },
  );
  if (status.status !== 0 || status.stdout !== "") throw new Error();
  mkdirSync(destination, { mode: 0o700 });
  created = destination;
  function pack(args) {
    const result = spawnSync(
      process.execPath,
      [
        process.env.npm_execpath,
        "pack",
        "--ignore-scripts",
        "--offline",
        "--json",
        ...args,
      ],
      { cwd: root, encoding: "utf8", timeout: 30_000 },
    );
    if (result.error || result.status !== 0) throw new Error();
    const reports = JSON.parse(result.stdout);
    if (!Array.isArray(reports) || reports.length !== 1) throw new Error();
    verifyPack(reports[0], expected);
    return reports[0];
  }
  pack(["--dry-run"]);
  const archive = pack(["--pack-destination", destination]);
  const sha256 = createHash("sha256")
    .update(readFileSync(join(destination, archive.filename)))
    .digest("hex");
  writeFileSync(
    join(destination, "candidate.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        commit,
        name: metadata.name,
        version: metadata.version,
        private: metadata.private === true,
        ...(metadata.private === true
          ? {}
          : { publishConfig: metadata.publishConfig }),
        archive: archive.filename,
        sha256,
        npmIntegrity: archive.integrity,
        files: expected,
      },
      null,
      2,
    )}\n`,
  );
  process.stdout.write(
    "Prepared an unpublished candidate and its commit/hash/file manifest.\n",
  );
} catch {
  if (created) rmSync(created, { recursive: true, force: true });
  process.stderr.write(
    "Candidate preparation failed. Check destination, clean tracked source, publication metadata and the exact allowlist.\n",
  );
  process.exitCode = 1;
}
