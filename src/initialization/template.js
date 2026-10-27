import { Buffer } from "node:buffer";
import { DISCOVERY_LIMITS } from "../discovery/source.js";

/** Pure generation: only portable names and fixed development placeholders are used. */
export function generateEnvTemplate(report, { additionalKeys = [] } = {}) {
  if (
    !report ||
    !Array.isArray(report.variables) ||
    report.variables.length > DISCOVERY_LIMITS.references ||
    report.complete !== true
  )
    throw new TypeError("A complete discovery report is required.");
  if (
    !Array.isArray(additionalKeys) ||
    additionalKeys.length > DISCOVERY_LIMITS.references
  )
    throw new RangeError("Generation limit exceeded.");
  const names = new Set();
  for (const name of additionalKeys) {
    if (
      typeof name !== "string" ||
      !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(name)
    )
      throw new TypeError("Portable variable names are required.");
    names.add(name);
  }
  for (const variable of report.variables) {
    if (
      !variable ||
      typeof variable.name !== "string" ||
      !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(variable.name)
    )
      throw new TypeError("Portable variable names are required.");
    if (!variable.frameworkProvided) names.add(variable.name);
  }
  if (names.size > DISCOVERY_LIMITS.references)
    throw new RangeError("Generation limit exceeded.");
  if (!names.size) return "";
  const lines = [
    "# ConfigPilot environment configuration",
    "# Review every placeholder; source references do not prove requiredness.",
    "# Fill credentials privately. Never commit real secrets.",
    "# Values and deployment provisioning are not validated by configpilot check.",
    "",
  ];
  for (const name of [...names].sort()) {
    lines.push(
      "# Selected/source key; may be optional or supplied externally.",
      `${name}=${name === "PORT" ? "3000" : name === "NODE_ENV" ? "development" : ""}`,
      "",
    );
  }
  const content = lines.join("\n");
  if (Buffer.byteLength(content) > DISCOVERY_LIMITS.outputBytes)
    throw new RangeError("Generation limit exceeded.");
  return content;
}
