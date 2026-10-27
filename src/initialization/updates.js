import { Buffer } from "node:buffer";
import { normalizeRules } from "../project/rules.js";

/** Read-only additions. Never reproduce or rewrite any existing assignment. */
export function previewTemplateUpdates(
  report,
  { requiredKeys = [], templateKeys = [] } = {},
) {
  normalizeRules({ requiredKeys });
  if (
    !Array.isArray(templateKeys) ||
    templateKeys.length > 4096 ||
    templateKeys.some(
      (k) => typeof k !== "string" || !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(k),
    )
  )
    throw new TypeError("Portable template keys are required.");
  if (
    !report ||
    report.complete !== true ||
    !Array.isArray(report.variables) ||
    report.variables.length > 4096
  )
    throw new TypeError("A complete discovery report is required.");
  if (
    report.configuration?.template !== undefined &&
    report.configuration.template !== null &&
    (typeof report.configuration.template !== "string" ||
      report.configuration.template.length > 4096)
  )
    throw new TypeError("A public template file label is required.");
  const keys = new Set(requiredKeys);
  for (const v of report.variables) {
    if (
      !v ||
      typeof v.name !== "string" ||
      !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(v.name)
    )
      throw new TypeError("Portable variable names are required.");
    if (v.inTemplate === true) keys.delete(v.name);
    else if (!v.frameworkProvided) keys.add(v.name);
  }
  for (const key of templateKeys) keys.delete(key);
  if (keys.size > 4096) throw new RangeError("Template update limit exceeded.");
  const names = [...keys].sort();
  const content = names.length
    ? "# Suggested template additions; review and copy manually.\n" +
      names.map((k) => `${k}=`).join("\n") +
      "\n"
    : "";
  if (Buffer.byteLength(content) > 262144)
    throw new RangeError("Template update limit exceeded.");
  return {
    schemaVersion: 1,
    kind: "template-diff",
    template: report.configuration?.template ?? null,
    keys: names,
    content,
  };
}
