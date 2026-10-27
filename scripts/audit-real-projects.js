// Maintainer audit only. TypeScript is an independent development-time AST reference.
// No project module, compiler configuration, dependencies or scripts are executed.
let ts;
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join, relative, extname, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { scanProject } from "../src/discovery/project.js";
const excluded = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  "vendor",
]);
const extensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
]);
function inventory(root) {
  const paths = [],
    pending = [root];
  while (pending.length) {
    const dir = pending.pop();
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || excluded.has(e.name)) continue;
      const file = join(dir, e.name);
      if (e.isDirectory()) pending.push(file);
      else if (
        e.isFile() &&
        extensions.has(extname(file)) &&
        !/\.d\.[cm]?ts$/.test(file)
      )
        paths.push(file);
    }
  }
  return paths.sort();
}
function reference(root, paths) {
  const compilerOptions = {
    allowJs: true,
    module: ts.ModuleKind.ESNext,
    moduleDetection: ts.ModuleDetectionKind.Force,
    noResolve: true,
    noLib: true,
    types: [],
    skipLibCheck: true,
  };
  const host = ts.createCompilerHost(compilerOptions);
  const load = host.getSourceFile.bind(host);
  host.getSourceFile = (...args) => {
    const source = load(...args);
    if (source) source.externalModuleIndicator ??= source.endOfFileToken;
    return source;
  };
  const program = ts.createProgram(paths, compilerOptions, host);
  const checker = program.getTypeChecker();
  const records = [];
  let malformedFiles = 0;
  const unwrap = (n) => {
    while (
      n &&
      (ts.isParenthesizedExpression(n) ||
        ts.isAsExpression(n) ||
        ts.isTypeAssertionExpression(n) ||
        ts.isNonNullExpression(n) ||
        ts.isSatisfiesExpression(n))
    )
      n = n.expression;
    return n;
  };
  const literal = (n) =>
    n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
      ? n.text
      : undefined;
  const prop = (n) =>
    ts.isPropertyAccessExpression(n)
      ? n.name.text
      : ts.isElementAccessExpression(n)
        ? literal(n.argumentExpression)
        : undefined;
  const lookup = (node, seen = new Set()) => {
    node = unwrap(node);
    if (!node) return;
    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      const declarations = (symbol?.declarations ?? []).filter((d) =>
        [
          ts.SyntaxKind.VariableDeclaration,
          ts.SyntaxKind.BindingElement,
          ts.SyntaxKind.ImportClause,
          ts.SyntaxKind.NamespaceImport,
          ts.SyntaxKind.ImportSpecifier,
          ts.SyntaxKind.Parameter,
          ts.SyntaxKind.FunctionDeclaration,
          ts.SyntaxKind.ClassDeclaration,
          ts.SyntaxKind.EnumDeclaration,
          ts.SyntaxKind.ModuleDeclaration,
        ].includes(d.kind),
      );
      if (!declarations.length)
        return node.text === "process" ? "process" : undefined;
      if (seen.has(symbol) || seen.size > 32) return;
      seen.add(symbol);
      const declaration = declarations[0];
      let statement = declaration;
      while (statement && !ts.isImportDeclaration(statement))
        statement = statement.parent;
      if (
        statement &&
        ["node:process", "process"].includes(literal(statement.moduleSpecifier))
      ) {
        if (ts.isImportClause(declaration) || ts.isNamespaceImport(declaration))
          return "process";
        if (ts.isImportSpecifier(declaration)) {
          const key = declaration.propertyName?.text ?? declaration.name.text;
          return key === "env"
            ? "process.env"
            : key === "default"
              ? "process"
              : undefined;
        }
      }
      if (
        ts.isVariableDeclaration(declaration) &&
        declaration.parent.flags & ts.NodeFlags.Const
      )
        return lookup(declaration.initializer, seen);
      return;
    }
    if (
      ts.isMetaProperty(node) &&
      node.keywordToken === ts.SyntaxKind.ImportKeyword
    )
      return "import.meta";
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments.length === 1 &&
      ["node:process", "process"].includes(literal(node.arguments[0])) &&
      !checker.getSymbolAtLocation(node.expression)
    )
      return "process";
    if (
      (ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)) &&
      prop(node) === "env"
    ) {
      const base = lookup(node.expression, seen);
      if (base === "process" || base === "import.meta") return `${base}.env`;
    }
  };
  for (const file of paths) {
    const source = program.getSourceFile(file);
    if (!source) continue;
    if (source.parseDiagnostics?.length) malformedFiles++;
    const record = (name, node) => {
      if (
        typeof name === "string" &&
        /^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(name)
      )
        records.push({
          name,
          file: relative(root, file).split(sep).join("/"),
          line:
            source.getLineAndCharacterOfPosition(node.getStart(source)).line +
            1,
        });
    };
    const visit = (node) => {
      if (
        (ts.isPropertyAccessExpression(node) ||
          ts.isElementAccessExpression(node)) &&
        ["process.env", "import.meta.env"].includes(lookup(node.expression))
      )
        record(prop(node), node);
      if (
        ts.isVariableDeclaration(node) &&
        ts.isObjectBindingPattern(node.name) &&
        ["process.env", "import.meta.env"].includes(lookup(node.initializer))
      ) {
        for (const binding of node.name.elements) {
          if (binding.dotDotDotToken) continue;
          const key = binding.propertyName ?? binding.name;
          record(ts.isIdentifier(key) ? key.text : literal(key), binding);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { records, malformedFiles };
}
if (process.argv[2] !== "--probe")
  ts = (await import("typescript-minimum")).default;
const cli = fileURLToPath(new URL("../bin/configpilot.js", import.meta.url));
if (process.argv[2] === "--probe") {
  const started = performance.now();
  const report = await scanProject({ root: process.argv[3] });
  process.stdout.write(
    JSON.stringify({
      report,
      elapsedMs: +(performance.now() - started).toFixed(2),
      maxRssMiB: +(process.resourceUsage().maxRSS / 1024).toFixed(2),
    }),
  );
} else {
  const manifest = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const results = [];
  const key = (r) => `${r.file}:${r.line}:${r.name}`;
  const difference = (left, right) => {
    const counts = new Map();
    for (const item of right)
      counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
    return left.filter((item) => {
      const count = counts.get(key(item)) ?? 0;
      if (count) {
        counts.set(key(item), count - 1);
        return false;
      }
      return true;
    });
  };
  for (const project of manifest) {
    const root = resolve(project.root),
      files = inventory(root);
    const before = files.map((f) => readFileSync(f));
    const child = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), "--probe", root],
      { encoding: "utf8", timeout: 45000, maxBuffer: 16 * 1024 * 1024 },
    );
    assert.equal(child.status, 0, `Probe failed for ${project.repository}`);
    const { report, elapsedMs, maxRssMiB } = JSON.parse(child.stdout);
    const independent = reference(root, files);
    const actual = report.variables.flatMap((v) =>
      v.references.map((r) => ({
        name: r.name,
        file: r.location.file,
        line: r.location.line,
      })),
    );
    const extra = difference(actual, independent.records),
      missing = difference(independent.records, actual);
    const init = spawnSync(
      process.execPath,
      [cli, "init", "--dry-run", "--json"],
      {
        cwd: root,
        encoding: "utf8",
        timeout: 45000,
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    const preview = JSON.parse(init.stdout);
    assert.ok(
      !existsSync(join(root, ".env")) &&
        !existsSync(join(root, ".env.example")),
    );
    for (let i = 0; i < files.length; i++)
      assert.deepEqual(readFileSync(files[i]), before[i]);
    const generated = preview.content ?? "";
    assert.ok(
      generated
        .split("\n")
        .filter((r) => r && !r.startsWith("#"))
        .every((r) => /^[A-Za-z_][A-Za-z0-9_]*=(?:3000|development)?$/.test(r)),
    );
    results.push({
      repository: project.repository,
      framework: project.framework,
      commit: project.commit,
      sourceInventory: project.sourceFiles.length,
      filesScanned: report.filesScanned,
      variables: report.variables.length,
      references: actual.length,
      independentReferences: independent.records.length,
      referenceParserMalformedFiles: independent.malformedFiles,
      unmatchedScanner: extra,
      unmatchedReference: missing,
      complete: report.complete,
      issues: report.issues
        .filter((i) => !i.name)
        .map((i) => ({
          code: i.code,
          ...(i.location ? { location: i.location } : {}),
        })),
      elapsedMs,
      maxRssMiB,
      initExit: init.status,
      initStatus: preview.status ?? preview.error?.code,
      previewPlaceholders: generated
        .split("\n")
        .filter((r) => r && !r.startsWith("#")).length,
      unchangedSources: true,
    });
  }
  writeFileSync(
    process.argv[3],
    JSON.stringify(
      {
        date: "2026-10-27",
        node: process.version,
        platform: process.platform,
        method:
          "Pinned repository JS/TS inventories, excluding env files and dependencies. Independent TypeScript compiler AST inventory; unmatched records require manual review, not assumed false positives/negatives. Source scopes are all supported regular files, plus explicit unsupported-component findings. No project code or installs executed.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  process.stdout.write(
    JSON.stringify(
      results.map(
        ({
          repository,
          filesScanned,
          variables,
          references,
          complete,
          unmatchedScanner,
          unmatchedReference,
          elapsedMs,
          maxRssMiB,
          initStatus,
        }) => ({
          repository,
          filesScanned,
          variables,
          references,
          complete,
          unmatchedScanner,
          unmatchedReference,
          elapsedMs,
          maxRssMiB,
          initStatus,
        }),
      ),
    ) + "\n",
  );
}
