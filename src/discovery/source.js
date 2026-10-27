import { Buffer } from "node:buffer";
import { parse } from "@babel/parser";
import {
  sourceBindings,
  member,
  property,
  literalKey,
  unwrap,
} from "./bindings.js";

export const DISCOVERY_LIMITS = Object.freeze({
  files: 1000,
  entries: 5000,
  depth: 32,
  fileBytes: 262144,
  totalBytes: 8388608,
  references: 4096,
  issues: 8192,
  outputBytes: 262144,
});
const NAME = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;
const builtins = new Set(["MODE", "DEV", "PROD", "SSR", "BASE_URL"]);

export function classifyVariable(name, syntax = "process.env") {
  const sensitive =
    /(?:SECRET|PASSWORD|PASSWD|TOKEN|CREDENTIAL|PRIVATE_KEY|API_KEY|DATABASE_URL|DB_URL)/.test(
      name,
    );
  const frameworkProvided = syntax === "import.meta.env" && builtins.has(name);
  let category = "Unknown";
  if (/^(?:VITE_|NEXT_PUBLIC_|PUBLIC_|REACT_APP_|VUE_APP_)/.test(name))
    category = "Public frontend configuration";
  else if (/DATABASE|^DB_|REDIS|MONGO|POSTGRES|MYSQL/.test(name))
    category = "Database configuration";
  else if (/JWT|AUTH|SESSION/.test(name)) category = "Authentication";
  else if (sensitive) category = "Credentials";
  else if (/^PORT$|HOST|SERVER/.test(name)) category = "Server configuration";
  else if (/LOG|DEBUG/.test(name)) category = "Logging";
  else if (/API|ENDPOINT/.test(name)) category = "API integration";
  else if (name === "NODE_ENV" || /APP_|NODE_/.test(name))
    category = "Application configuration";
  return {
    category,
    purpose:
      category === "Unknown"
        ? "Purpose cannot be inferred from the name."
        : `Potential ${category.toLowerCase()}.`,
    potentiallySensitive: sensitive,
    frameworkProvided,
    confidence: category === "Unknown" ? "low" : "medium",
  };
}

/** Pure extraction: no source snippets or fallback values escape the AST. */
export function scanSource(source, { file = "source.js" } = {}) {
  if (
    typeof source !== "string" ||
    typeof file !== "string" ||
    !file ||
    file.length > 1024
  )
    throw new TypeError("Source and a short public file label are required.");
  if (
    source.length > DISCOVERY_LIMITS.fileBytes ||
    Buffer.byteLength(source) > DISCOVERY_LIMITS.fileBytes
  )
    throw new RangeError("Source exceeds discovery limits.");
  const refs = [],
    issues = [];
  let ast;
  try {
    ast = parse(source, {
      sourceType: "unambiguous",
      plugins: [
        "decorators-legacy",
        ...(/\.[cm]?tsx?$/.test(file) ? ["typescript"] : []),
        ...(!/\.[cm]?ts$/.test(file) ? ["jsx"] : []),
      ],
      attachComment: false,
      errorRecovery: false,
    });
  } catch (error) {
    const line =
      Number.isInteger(error?.loc?.line) && error.loc.line > 0
        ? error.loc.line
        : 1;
    return {
      references: [],
      issues: [
        {
          code: "SOURCE_PARSE_ERROR",
          severity: "warning",
          location: { file, line },
          message:
            "Source could not be parsed; no references were inferred from this file.",
        },
      ],
    };
  }
  const bindings = sourceBindings(ast);
  const staticFallback = (node) =>
    [
      "StringLiteral",
      "NumericLiteral",
      "BooleanLiteral",
      "NullLiteral",
    ].includes(unwrap(node)?.type);
  const unresolved = (node) => {
    issues.push({
      code: "SOURCE_DYNAMIC_REFERENCE",
      severity: "info",
      location: { file, line: node.loc.start.line },
      message:
        "Environment lookup or object use could not be resolved to individual keys. Review this location; no expression text was retained.",
    });
  };
  const reference = (name, node, syntax, notation, fallback) => {
    if (typeof name !== "string" || !NAME.test(name)) {
      unresolved(node);
      return;
    }
    refs.push({
      name,
      location: { file, line: node.loc.start.line },
      syntax,
      notation,
      hasStaticFallback: fallback,
    });
  };
  for (const node of bindings.nodes) {
    const { node: outer, parent } = bindings.outer(node);
    if (
      bindings.isBinding(node) ||
      (parent?.type === "ObjectProperty" &&
        parent.key === node &&
        !parent.computed) ||
      (member(parent) && parent.property === node && !parent.computed)
    )
      continue;
    const syntax = member(node) ? bindings.objectKind(node.object) : undefined;
    if (["process.env", "import.meta.env"].includes(syntax)) {
      reference(
        property(node),
        node,
        syntax,
        node.computed ? "bracket" : "dot",
        parent?.type === "LogicalExpression" &&
          parent.left === outer &&
          ["??", "||"].includes(parent.operator) &&
          staticFallback(parent.right),
      );
    }
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "ObjectPattern"
    ) {
      const object = bindings.objectKind(node.init);
      if (["process.env", "import.meta.env"].includes(object)) {
        for (const part of node.id.properties) {
          if (part.type !== "ObjectProperty") {
            unresolved(part);
            continue;
          }
          const name = part.computed
            ? literalKey(part.key)
            : part.key.type === "Identifier"
              ? part.key.name
              : literalKey(part.key);
          reference(
            name,
            part,
            object,
            "destructuring",
            part.value.type === "AssignmentPattern" &&
              staticFallback(part.value.right),
          );
        }
      }
    }
    // Mark whole-object escapes and unsupported mutable aliases, rather than
    // silently pretending every possible key was discovered.
    const object = bindings.objectKind(node);
    if (
      ["process.env", "import.meta.env"].includes(object) &&
      unwrap(node) === node
    ) {
      const consumed =
        (member(parent) && unwrap(parent.object) === node) ||
        (parent?.type === "VariableDeclarator" &&
          unwrap(parent.init) === node &&
          (parent.id.type === "ObjectPattern" ||
            (parent.id.type === "Identifier" &&
              bindings.objectKind(parent.id) === object)));
      if (!consumed) unresolved(node);
    }
    if (refs.length + issues.length > DISCOVERY_LIMITS.references)
      throw new RangeError("Reference limit exceeded.");
  }
  refs.sort(
    (a, b) =>
      a.location.line - b.location.line || a.name.localeCompare(b.name, "en"),
  );
  issues.sort((a, b) => a.location.line - b.location.line);
  return { references: refs, issues };
}
