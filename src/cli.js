import { resolve } from "node:path";
import process from "node:process";
import { analyzeConfig } from "./analyzer/config-analyzer.js";
import { formatJson } from "./reporters/json.js";
import { formatTerminal } from "./reporters/terminal.js";
import { inputErrorCode, readConfigFile } from "./utils/read-config-file.js";

const HELP = `ConfigPilot — Explainable environment-configuration diagnostics

Usage:
  configpilot check [--template PATH] [--env PATH] [--json]
  configpilot check --help
  configpilot --help
  configpilot --version

Options:
  --template PATH  Reference file (default: .env.example).
  --env PATH       Environment file (default: .env).
  --json           Emit one JSON object instead of terminal text.
  --help           Show this help message.
  --version        Show the package version (standalone).

Path options also accept --template=PATH and --env=PATH.
Paths are relative to the working directory. Only regular UTF-8 files up to
1,048,576 bytes are accepted. Files are never modified; values are never reported.

Exit codes:
  0  No warnings/errors, or help/version completed.
  1  Analysis reports warnings or errors; review findings.
  2  Invalid arguments, unreadable input, or operational failure.
`;

const ERRORS = {
  INVALID_ARGUMENTS: [
    "Unsupported or incomplete command arguments.",
    "Run configpilot --help for usage and available options.",
  ],
  FILE_NOT_FOUND: [
    "Selected input file was not found.",
    "Check the selected path and working directory, then rerun.",
  ],
  FILE_NOT_READABLE: [
    "Selected input file could not be read.",
    "Check access permissions and select a readable regular file.",
  ],
  NOT_REGULAR_FILE: [
    "Selected input is not a regular file.",
    "Select a regular file; directories, pipes, and devices are unsupported.",
  ],
  FILE_TOO_LARGE: [
    "Selected input exceeds the limit of 1,048,576 bytes.",
    "Use a smaller configuration file within the documented limit.",
  ],
  INVALID_ENCODING: [
    "Selected input is not valid UTF-8 text.",
    "Save the selected configuration file as UTF-8 and rerun.",
  ],
  INTERNAL_ERROR: [
    "ConfigPilot could not complete the command.",
    "Retry with supported inputs. If the problem persists, report it without configuration values.",
  ],
};

/** Operational errors intentionally omit paths, raw arguments, and native errors. */
export function cliFailure(code, json, source, message) {
  const [defaultMessage, recommendation] = ERRORS[code];
  const error = {
    code,
    ...(source ? { source } : {}),
    message: message ?? defaultMessage,
    recommendation,
  };
  return json
    ? {
        exitCode: 2,
        stdout: formatJson({ schemaVersion: 1, error }),
        stderr: "",
      }
    : {
        exitCode: 2,
        stdout: "",
        stderr: `ConfigPilot: ${code}${source ? ` (${source})` : ""}\n${error.message}\nAction: ${recommendation}\n`,
      };
}

function invalid(message) {
  return { error: message ?? ERRORS.INVALID_ARGUMENTS[0] };
}

/** Pure argument parsing: no file reads or arbitrary argument echoing. */
export function parseArguments(args) {
  if (
    args.length === 0 ||
    (args.length === 1 && args[0] === "--help") ||
    (args.length === 2 && args[0] === "check" && args[1] === "--help")
  )
    return { command: "help" };
  if (args.length === 1 && args[0] === "--version")
    return { command: "version" };
  if (args[0] !== "check") return invalid();
  const options = {
    command: "check",
    templatePath: ".env.example",
    environmentPath: ".env",
    json: false,
  };
  const names = { "--template": "templatePath", "--env": "environmentPath" };
  const seen = new Set();
  for (let index = 1; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--json") {
      if (seen.has(token))
        return invalid("Option --json must be supplied only once.");
      seen.add(token);
      options.json = true;
      continue;
    }
    const separator = token.indexOf("=");
    const flag = separator === -1 ? token : token.slice(0, separator);
    if (!Object.hasOwn(names, flag)) return invalid();
    if (seen.has(flag))
      return invalid(`Option ${flag} must be supplied only once.`);
    seen.add(flag);
    const value = separator === -1 ? args[++index] : token.slice(separator + 1);
    if (
      !value ||
      value.includes("\0") ||
      (separator === -1 && value.startsWith("-"))
    )
      return invalid(`Provide a non-empty file path for ${flag}.`);
    options[names[flag]] = value;
  }
  return options;
}

/** CLI orchestration; injectable reads keep unit tests independent of the disk. */
export async function runCli(
  args,
  { version, cwd = process.cwd(), readFile = readConfigFile },
) {
  const jsonRequested = args[0] === "check" && args.includes("--json");
  try {
    const options = parseArguments(args);
    if (options.error)
      return cliFailure(
        "INVALID_ARGUMENTS",
        jsonRequested,
        undefined,
        options.error,
      );
    if (options.command === "help")
      return { exitCode: 0, stdout: HELP, stderr: "" };
    if (options.command === "version")
      return { exitCode: 0, stdout: `${version}\n`, stderr: "" };

    const inputs = {};
    for (const [source, path] of [
      ["template", options.templatePath],
      ["environment", options.environmentPath],
    ]) {
      try {
        inputs[source] = await readFile(resolve(cwd, path));
      } catch (error) {
        return cliFailure(inputErrorCode(error), options.json, source);
      }
    }
    const report = analyzeConfig({
      ...inputs,
      templateFile: options.templatePath,
      environmentFile: options.environmentPath,
    });
    return {
      exitCode:
        report.summary.errors > 0 || report.summary.warnings > 0 ? 1 : 0,
      stdout: options.json ? formatJson(report) : formatTerminal(report),
      stderr: "",
    };
  } catch {
    return cliFailure("INTERNAL_ERROR", jsonRequested);
  }
}
