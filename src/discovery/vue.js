import { parse } from "@vue/compiler-sfc";
import { scanSource, DISCOVERY_LIMITS } from "./source.js";

/** Parse only. Never compile/evaluate scripts, resolve src attributes or load plugins. */
export function scanVueSource(source, { file }) {
  const result = { references: [], issues: [] };
  const skipped = (line = 1) =>
    result.issues.push({
      code: "SOURCE_PARSE_ERROR",
      severity: "warning",
      location: { file, line },
      message:
        "Vue source contains unsupported or invalid syntax; discovery is incomplete. No source text was retained.",
    });
  let descriptor, errors;
  try {
    ({ descriptor, errors } = parse(source, {
      filename: file,
      sourceMap: false,
      templateParseOptions: { onWarn: () => {} },
    }));
  } catch {
    skipped();
    return result;
  }
  if (errors.length) {
    skipped();
    return result;
  }
  const extract = (content, line, extension, prefix = "", suffix = "") => {
    const padded = "\n".repeat(line - 1) + prefix + content + suffix;
    const found = scanSource(padded, { file: "component" + extension });
    for (const r of [...found.references, ...found.issues])
      r.location.file = file;
    result.references.push(...found.references);
    result.issues.push(...found.issues);
    if (
      result.references.length + result.issues.length >
      DISCOVERY_LIMITS.references
    )
      throw new RangeError("Reference limit exceeded.");
  };
  if (descriptor.script && descriptor.scriptSetup) {
    skipped(descriptor.scriptSetup.loc.start.line);
    return result;
  }
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (!block) continue;
    if (
      block.src ||
      ![undefined, "js", "ts", "jsx", "tsx"].includes(block.lang)
    ) {
      skipped(block.loc.start.line);
      continue;
    }
    extract(block.content, block.loc.start.line, "." + (block.lang ?? "js"));
  }
  const template = descriptor.template;
  if (template) {
    if (template.src || (template.lang && template.lang !== "html"))
      skipped(template.loc.start.line);
    else {
      // Never analyze template expressions as independent JS: script bindings,
      // v-for and v-slot can shadow process/import aliases. Explicitly report the
      // unresolved scope rather than inventing names or claiming full coverage.
      const stack = [template.ast];
      let unresolved = false;
      while (stack.length) {
        const node = stack.pop();
        if (!node) continue;
        if (
          node.type === 5 ||
          (node.type === 1 &&
            node.props.some(
              (p) => p.type === 7 && (p.exp || p.arg?.isStatic === false),
            ))
        )
          unresolved = true;
        if (node.children) stack.push(...node.children);
      }
      if (unresolved)
        result.issues.push({
          code: "SOURCE_DYNAMIC_REFERENCE",
          severity: "info",
          location: { file, line: template.loc.start.line },
          message:
            "Vue template expressions are outside script-block analysis. Review this template; no template variable names were inferred.",
        });
    }
  }
  return result;
}
