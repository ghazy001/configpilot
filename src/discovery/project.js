import { URL } from "node:url";
import { setTimeout, clearTimeout } from "node:timers";
import { TextEncoder } from "node:util";
import { lstat, realpath, opendir } from "node:fs/promises";
import { resolve, relative, sep, extname, join } from "node:path";
import { Worker } from "node:worker_threads";
import { readConfigFile } from "../utils/read-config-file.js";
import { parseDotenv } from "../parser/dotenv-parser.js";
import { DISCOVERY_LIMITS as L, classifyVariable } from "./source.js";

const EXCLUDE = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  "vendor",
]);
const EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
]);
const CONFIGS = [
  ".env",
  ".env.example",
  ".env.sample",
  ".env.local",
  ".env.development",
  ".env.production",
];
export function discoveryError(code) {
  return Object.assign(new Error(code), { code });
}
const label = (root, path) => relative(root, path).split(sep).join("/");
const order = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function issue(code, message, location) {
  return { code, severity: "info", message, ...(location ? { location } : {}) };
}

function parserWorker() {
  let worker;
  return {
    async parse(source, file) {
      worker ??= new Worker(new URL("./worker.js", import.meta.url), {
        resourceLimits: { maxOldGenerationSizeMb: 96, stackSizeMb: 4 },
        execArgv: [],
        env: {},
      });
      return new Promise((resolve) => {
        const current = worker;
        const finish = (result) => {
          clearTimeout(timer);
          current.removeListener("message", done);
          current.removeListener("error", failed);
          current.removeListener("exit", failed);
          resolve(result);
        };
        const done = (result) => finish(result);
        const failed = () => {
          worker = undefined;
          current.terminate();
          finish({ failed: true });
        };
        const timer = setTimeout(failed, 2000);
        current.once("message", done);
        current.once("error", failed);
        current.once("exit", failed);
        current.postMessage({ source, file });
      });
    },
    async close() {
      if (worker) await worker.terminate();
    },
  };
}

/** Bounded read-only scan. Project code and project parser configuration are never loaded. */
export async function scanProjectContext({
  root = ".",
  path = ".",
  template,
  environment,
} = {}) {
  if ([root, path].some((v) => typeof v !== "string" || !v || v.includes("\0")))
    throw new TypeError("Root and path must be nonempty paths.");
  let base, scope;
  try {
    base = await realpath(resolve(root));
    scope = resolve(base, path);
    const rel = relative(base, scope);
    if (
      rel.startsWith(`..${sep}`) ||
      rel === ".." ||
      resolve(scope) !== scope ||
      (await realpath(scope)) !== scope ||
      !(await lstat(scope)).isDirectory()
    )
      throw new Error();
  } catch {
    throw discoveryError("SCAN_PATH_INVALID");
  }
  const report = {
    schemaVersion: 1,
    kind: "discovery",
    complete: true,
    filesScanned: 0,
    bytesScanned: 0,
    variables: [],
    issues: [],
    configuration: { detected: [], template: null, environment: null },
  };
  const add = (entry) => {
    if (report.issues.length >= L.issues)
      throw discoveryError("SCAN_LIMIT_EXCEEDED");
    report.issues.push(entry);
  };
  const found = new Map();
  const parser = parserWorker();
  let entries = 0,
    refs = 0;
  const start = Date.now();
  const pending = [{ dir: scope, depth: 0 }];
  try {
    while (pending.length) {
      const { dir, depth } = pending.pop();
      if (depth > L.depth || Date.now() - start > 30000)
        throw discoveryError("SCAN_LIMIT_EXCEEDED");
      // Revalidate every directory; skip links rather than following them.
      if (
        (await realpath(dir)) !== dir ||
        (await lstat(dir)).isSymbolicLink()
      ) {
        report.complete = false;
        add(
          issue(
            "SOURCE_SKIPPED",
            "A symlink or changed directory was skipped.",
          ),
        );
        continue;
      }
      const listing = [];
      const handle = await opendir(dir);
      for await (const entry of handle) {
        if (++entries > L.entries) throw discoveryError("SCAN_LIMIT_EXCEEDED");
        listing.push(entry);
      }
      listing.sort((a, b) => order(a.name, b.name));
      for (const entry of listing) {
        if (entry.name.startsWith(".") || EXCLUDE.has(entry.name)) continue;
        const full = join(dir, entry.name);
        if (entry.isSymbolicLink()) {
          add(
            issue("SOURCE_SYMLINK_SKIPPED", "A symbolic link was not scanned."),
          );
          continue;
        }
        if (entry.isDirectory()) {
          pending.push({ dir: full, depth: depth + 1 });
          continue;
        }
        if (
          entry.isFile() &&
          [".vue", ".svelte", ".astro"].includes(extname(entry.name))
        ) {
          report.complete = false;
          const file = label(base, full);
          if (file.length > 1024) throw discoveryError("SCAN_LIMIT_EXCEEDED");
          add(
            issue(
              "SOURCE_SKIPPED",
              "Component format is unsupported; its embedded code was not scanned.",
              { file, line: 1 },
            ),
          );
          continue;
        }
        if (
          !entry.isFile() ||
          !EXTENSIONS.has(extname(entry.name)) ||
          /\.d\.[cm]?ts$/.test(entry.name)
        )
          continue;
        if (report.filesScanned >= L.files || Date.now() - start > 30000)
          throw discoveryError("SCAN_LIMIT_EXCEEDED");
        const file = label(base, full);
        if (file.length > 1024) throw discoveryError("SCAN_LIMIT_EXCEEDED");
        let source;
        try {
          const info = await lstat(full);
          if (
            !info.isFile() ||
            info.isSymbolicLink() ||
            info.size > L.fileBytes ||
            (await realpath(full)) !== full
          )
            throw new Error();
          source = await readConfigFile(full, {
            noFollow: true,
            maxBytes: L.fileBytes,
          });
          const bytes = new TextEncoder().encode(source).length;
          if (bytes > L.fileBytes) throw new Error();
          report.bytesScanned += Math.max(info.size, bytes);
          if (report.bytesScanned > L.totalBytes)
            throw discoveryError("SCAN_LIMIT_EXCEEDED");
          if (source.includes("\0")) throw new Error();
        } catch (error) {
          if (error.code === "SCAN_LIMIT_EXCEEDED") throw error;
          report.complete = false;
          add(
            issue(
              "SOURCE_SKIPPED",
              "A source file was unreadable, binary, oversized or changed.",
              { file, line: 1 },
            ),
          );
          continue;
        }
        report.filesScanned++;
        const parsed = await parser.parse(source, file);
        if (parsed.failed) {
          report.complete = false;
          add(
            issue(
              "SOURCE_SKIPPED",
              "Source parsing exceeded its resource budget.",
              { file, line: 1 },
            ),
          );
          continue;
        }
        for (const entry of parsed.issues) {
          add(entry);
          if (entry.code === "SOURCE_PARSE_ERROR") report.complete = false;
        }
        refs += parsed.references.length + parsed.issues.length;
        if (refs > L.references) throw discoveryError("SCAN_LIMIT_EXCEEDED");
        for (const reference of parsed.references) {
          if (!found.has(reference.name)) found.set(reference.name, []);
          found.get(reference.name).push(reference);
        }
      }
    }
  } catch (error) {
    if (error.code === "SCAN_LIMIT_EXCEEDED") throw error;
    throw discoveryError("SCAN_READ_FAILED");
  } finally {
    await parser.close();
  }
  for (const name of CONFIGS) {
    try {
      const info = await lstat(join(base, name));
      if (info.isFile() && !info.isSymbolicLink())
        report.configuration.detected.push(name);
    } catch {
      /* Discovery does not read unselected files. */
    }
  }
  const selected = {
    template:
      template ??
      (report.configuration.detected.includes(".env.example")
        ? ".env.example"
        : report.configuration.detected.includes(".env.sample")
          ? ".env.sample"
          : null),
    environment:
      environment ??
      (report.configuration.detected.includes(".env") ? ".env" : null),
  };
  const keySets = {};
  for (const role of ["template", "environment"]) {
    const name = selected[role];
    keySets[role] = null;
    if (name === null) continue;
    if (typeof name !== "string" || !name || name.includes("\0"))
      throw discoveryError("SCAN_CONFIG_INVALID");
    const full = resolve(base, name);
    try {
      const rel = relative(base, full);
      if (
        rel === ".." ||
        rel.startsWith(`..${sep}`) ||
        (await realpath(full)) !== full ||
        (await lstat(full)).isSymbolicLink()
      )
        throw new Error();
      const file = label(base, full);
      const parsed = parseDotenv(
        await readConfigFile(full, { noFollow: true }),
        { file },
      );
      report.configuration[role] = file;
      if (parsed.issues.some((i) => i.severity === "error")) {
        report.complete = false;
        add(
          issue(
            "SOURCE_CONFIG_INVALID",
            "Selected configuration syntax prevents reliable key comparison.",
          ),
        );
      } else keySets[role] = new Set(parsed.declarations.map((d) => d.key));
    } catch {
      throw discoveryError("SCAN_CONFIG_INVALID");
    }
  }
  for (const [name, references] of [...found].sort(([a], [b]) => order(a, b))) {
    references.sort(
      (a, b) =>
        order(a.location.file, b.location.file) ||
        a.location.line - b.location.line,
    );
    const classifications = references.map((r) =>
      classifyVariable(name, r.syntax),
    );
    const classification = classifications[0];
    const frameworkProvided = classifications.every((c) => c.frameworkProvided);
    const variable = {
      name,
      ...classification,
      frameworkProvided,
      referenceCount: references.length,
      references,
      hasStaticFallback: references.some((r) => r.hasStaticFallback),
      potentiallyRequired:
        !frameworkProvided && references.some((r) => !r.hasStaticFallback),
      inTemplate: keySets.template === null ? null : keySets.template.has(name),
      inEnvironment:
        keySets.environment === null ? null : keySets.environment.has(name),
    };
    report.variables.push(variable);
    for (const [condition, code, message] of [
      [
        variable.inTemplate === false && !frameworkProvided,
        "SOURCE_UNDOCUMENTED_KEY",
        "Referenced key is absent from the selected template; document it if intentional.",
      ],
      [
        variable.inEnvironment === false && variable.potentiallyRequired,
        "SOURCE_MISSING_LOCAL_KEY",
        "No local declaration was found. This key may be optional or provided externally.",
      ],
      [
        variable.hasStaticFallback,
        "SOURCE_OPTIONAL_REFERENCE",
        "At least one reference has a static fallback; other references may still need configuration.",
      ],
      [
        variable.potentiallySensitive,
        "SOURCE_POTENTIAL_SECRET",
        "The name suggests sensitive configuration. Keep real credentials private; public-prefixed keys may reach the browser.",
      ],
    ])
      if (condition) add({ ...issue(code, message), name });
  }
  return {
    report,
    configurationKeys: [
      ...new Set([...(keySets.template ?? []), ...(keySets.environment ?? [])]),
    ],
  };
}

export async function scanProject(options) {
  return (await scanProjectContext(options)).report;
}
