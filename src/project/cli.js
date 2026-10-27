import { Buffer } from "node:buffer";
import { relative, sep } from "node:path";
import { runCli, parseArguments } from "../cli.js";
import { argumentsFor } from "../discovery/cli.js";
import { loadProjectConfig, containedPath } from "./config.js";
import { projectError } from "./rules.js";
import { readConfigFile } from "../utils/read-config-file.js";
import { formatCliError } from "../reporters/terminal.js";
import { formatJson } from "../reporters/json.js";
import { formatWorkspaces } from "../reporters/project.js";
import { formatGithub } from "../reporters/github.js";

export const PROJECT_FLAGS = [
  "--config",
  "--workspace",
  "--workspaces",
  "--github",
];
function flags(args) {
  const stripped = [args[0]],
    options = {},
    seen = new Set();
  for (let i = 1; i < args.length; i++) {
    const token = args[i],
      split = token.indexOf("="),
      flag = split < 0 ? token : token.slice(0, split);
    if (!PROJECT_FLAGS.includes(flag)) {
      stripped.push(token);
      continue;
    }
    if (seen.has(flag)) throw projectError("PROJECT_ARGUMENTS");
    seen.add(flag);
    if (["--workspaces", "--github"].includes(flag)) {
      if (split >= 0) throw projectError("PROJECT_ARGUMENTS");
      options[flag.slice(2)] = true;
    } else {
      const value = split < 0 ? args[++i] : token.slice(split + 1);
      if (!value || value.startsWith("-") || value.includes("\0"))
        throw projectError("PROJECT_ARGUMENTS");
      options[flag.slice(2)] = value;
    }
  }
  if (
    (options.workspace && options.workspaces) ||
    ((options.workspace || options.workspaces) && !options.config) ||
    (options.workspaces && args[0] === "init") ||
    (options.github && (args.includes("--json") || args[0] === "init"))
  )
    throw projectError("PROJECT_ARGUMENTS");
  return { stripped, options };
}
function withDefault(args, flag, value) {
  if (
    value !== undefined &&
    !args.some((a) => a === flag || a.startsWith(flag + "="))
  )
    args.push(`${flag}=${value}`);
}
export async function runProjectCli(args, context) {
  const json = args.includes("--json");
  let github = false;
  try {
    const { stripped, options } = flags(args);
    github = options.github;
    if (!["check", "scan", "init"].includes(args[0]))
      throw projectError("PROJECT_ARGUMENTS");
    if (stripped.length === 2 && stripped[1] === "--help")
      return runCli(stripped, context);
    const parsed =
      args[0] === "check" ? parseArguments(stripped) : argumentsFor(stripped);
    if (parsed.error) throw projectError("PROJECT_ARGUMENTS");
    const base = await containedPath(context.cwd, ".", true);
    const config = options.config
      ? await loadProjectConfig(base, options.config)
      : undefined;
    const selected = options.workspaces
      ? config.workspaces
      : options.workspace
        ? config.workspaces.filter((w) => w.name === options.workspace)
        : [{ name: "project", root: ".", rules: config?.rules }];
    if (!selected.length) throw projectError("PROJECT_ARGUMENTS");
    const budget = {
      entries: 0,
      files: 0,
      bytes: 0,
      references: 0,
      issues: 0,
      started: Date.now(),
    };
    const results = [];
    for (const workspace of selected) {
      const root = await containedPath(base, workspace.root, true);
      const command = [...stripped];
      if (args[0] !== "init") {
        withDefault(command, "--template", workspace.template);
        withDefault(command, "--env", workspace.environment);
      }
      if (args[0] !== "check") withDefault(command, "--path", workspace.path);
      const machine = options.workspaces || options.github;
      if (machine && !command.includes("--json")) command.push("--json");
      const result = await runCli(command, {
        ...context,
        cwd: root,
        policyRules: workspace.rules,
        budget,
        display: {
          ...context.display,
          stdout: {
            ...context.display?.stdout,
            ...(options.config
              ? {
                  project: {
                    config: options.config,
                    root: relative(base, root).split(sep).join("/") || ".",
                    workspace: options.workspace,
                  },
                }
              : {}),
          },
        },
        readFile: config
          ? async (path) => {
              const full = await containedPath(root, relative(root, path));
              return (context.readFile ?? readConfigFile)(full, {
                noFollow: true,
              });
            }
          : context.readFile,
      });
      if (!machine) return result;
      const report = JSON.parse(result.stdout);
      results.push({
        name: workspace.name,
        root: relative(base, root).split(sep).join("/") || ".",
        exitCode: result.exitCode,
        report,
      });
      if (
        results.reduce((n, w) => n + (w.report.issues?.length ?? 0), 0) > 8192
      )
        throw projectError("PROJECT_LIMIT_EXCEEDED");
    }
    const report = options.workspaces
      ? {
          schemaVersion: 1,
          kind: "workspaces",
          command: args[0],
          workspaces: results,
        }
      : results[0].report;
    const code = Math.max(...results.map((w) => w.exitCode));
    const output = options.github
      ? formatGithub({ kind: "workspaces", workspaces: results })
      : json
        ? formatJson(report)
        : formatWorkspaces(report, {
            ...context.display?.stdout,
            verbose: args.includes("--verbose"),
            ...(args.includes("--no-color") ? { color: false } : {}),
          });
    if (Buffer.byteLength(output) > 4 * 1024 * 1024)
      throw projectError("PROJECT_LIMIT_EXCEEDED");
    return { exitCode: code, stdout: output, stderr: "" };
  } catch (error) {
    const code = [
      "PROJECT_CONFIG_INVALID",
      "PROJECT_PATH_INVALID",
      "PROJECT_ARGUMENTS",
      "PROJECT_LIMIT_EXCEEDED",
    ].includes(error?.code)
      ? error.code
      : "PROJECT_FAILED";
    const messages = {
      PROJECT_CONFIG_INVALID:
        "Select a regular UTF-8 JSON policy up to 65,536 bytes with schemaVersion 1 and supported rules.",
      PROJECT_PATH_INVALID:
        "Selected project, workspace or input path is unreadable, outside its root or traverses a symlink.",
      PROJECT_ARGUMENTS:
        "Use --config FILE with a configured --workspace NAME or read-only --workspaces. --github supports check/scan and excludes --json.",
      PROJECT_LIMIT_EXCEEDED:
        "Workspace reporting exceeds its finding/output budget. Select fewer roots or a smaller source scope.",
      PROJECT_FAILED:
        "The selected project workflow could not complete safely.",
    };
    const failure = {
      code,
      message: messages[code],
      recommendation:
        "Review project JSON/schema, explicit root paths and command help. No raw exception details are reported.",
    };
    const report = { schemaVersion: 1, kind: "project-error", error: failure };
    return {
      exitCode: 2,
      stdout: github ? formatGithub(report) : json ? formatJson(report) : "",
      stderr:
        github || json
          ? ""
          : formatCliError(failure, {
              ...context.display?.stderr,
              ...(args.includes("--no-color") ? { color: false } : {}),
            }),
    };
  }
}
