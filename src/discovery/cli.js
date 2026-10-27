import { scanProjectContext, discoveryError } from "./project.js";
import { previewTemplateUpdates } from "../initialization/updates.js";
import { formatTemplateUpdates } from "../reporters/project.js";
import { generateEnvTemplate } from "../initialization/template.js";
import {
  createEnvFile,
  validateOutput,
  inspectDestination,
  gitIgnoreStatus,
} from "../initialization/create.js";
import { formatJson } from "../reporters/json.js";
import { formatCliError, writer } from "../reporters/terminal.js";
import {
  formatDiscovery,
  formatInitializationPreview,
  formatInitializationSuccess,
} from "../reporters/discovery.js";
export { formatDiscovery } from "../reporters/discovery.js";

const ERRORS = {
  TEMPLATE_DIFF_INCOMPLETE:
    "Resolve incomplete discovery before previewing template additions.",
  DISCOVERY_ARGUMENTS:
    "Unsupported, repeated or incomplete discovery arguments. Run configpilot scan --help or configpilot init --help.",
  SCAN_PATH_INVALID:
    "Select an existing directory inside the project root without symlink traversal.",
  SCAN_READ_FAILED:
    "Source traversal failed. Check directory access permissions.",
  SCAN_LIMIT_EXCEEDED:
    "Discovery limits were exceeded. Select a smaller source directory with --path.",
  SCAN_CONFIG_INVALID:
    "Selected configuration cannot be read safely. Check its path, type, encoding and size.",
  INIT_EXISTS:
    "Destination already exists. It was not overwritten. Use --dry-run or choose another root-level --output filename.",
  INIT_OUTPUT_INVALID:
    "Choose a nonexistent root-level output filename. Nested paths and symlink destinations are not accepted.",
  INIT_CONFIRMATION_REQUIRED:
    "Creation requires confirmation. Use --dry-run to preview. In non-interactive or JSON mode, --yes authorizes a new file only.",
  INIT_CONTENT_INVALID:
    "Generated content is empty or exceeds its size budget.",
  INIT_INCOMPLETE:
    "Discovery was incomplete. Resolve skipped files or syntax errors before initialization.",
  INIT_WRITE_FAILED:
    "Creation failed. A partial new file may remain; inspect it manually. Existing files were not overwritten.",
  DISCOVERY_FAILED:
    "Discovery could not complete safely. Retry with supported source files.",
};
export function discoveryHelp(command) {
  return `ConfigPilot — Environment ${command === "scan" ? "Discovery" : "Initialization"}\n\nUsage:\n  configpilot ${command} [--path DIRECTORY] [--json] [--verbose] [--no-color]\n${command === "init" ? "  --template       Generate .env.example instead of .env.\n  --output FILE    Root-level filename; never overwrite.\n  --dry-run        Preview only; no creation or confirmation.\n  --yes            Authorize a new file; never overwrite.\n" : "  --template FILE  Select a template explicitly (default .env.example/.env.sample).\n  --env FILE       Select a local file explicitly (default .env).\n"}  --config FILE    Explicit JSON rules; no project code executes.\n  --workspace NAME Select one configured root; --workspaces scans all (scan only).\n  --template-diff  Read-only missing template assignments (scan only).\n  --github         GitHub annotations (scan only; exclusive with --json).\n  --path DIRECTORY Source scope inside cwd (default .).\n  --json           One machine-readable object; no prompts.\n  --verbose        Include safe reference locations.\n  --no-color       Disable ANSI styling.\n  --help           Show help.\n\nWorkflow: scan -> init --template -> init -> check\nReferences do not prove requiredness. No source values are reported.\nScan exits: 0 complete, 1 incomplete, 2 operational/argument failure.\nInit exits: 0 created/preview/cancelled/no variables, 2 failure.\n`;
}
export function argumentsFor(args) {
  const command = args[0];
  if (args.length === 2 && args[1] === "--help") return { help: true, command };
  const options = { command, path: "." };
  const booleans = {
    "--json": "json",
    "--verbose": "verbose",
    "--no-color": "noColor",
    ...(command === "init"
      ? {
          "--template": "publicTemplate",
          "--yes": "yes",
          "--dry-run": "dryRun",
        }
      : { "--template-diff": "templateDiff" }),
  };
  const values = {
    "--path": "path",
    ...(command === "init"
      ? { "--output": "output" }
      : { "--template": "template", "--env": "environment" }),
  };
  const seen = new Set();
  for (let index = 1; index < args.length; index++) {
    const token = args[index],
      split = token.indexOf("="),
      flag = split < 0 ? token : token.slice(0, split);
    if (seen.has(flag)) throw discoveryError("DISCOVERY_ARGUMENTS");
    seen.add(flag);
    if (Object.hasOwn(booleans, token)) {
      options[booleans[token]] = true;
      continue;
    }
    if (!Object.hasOwn(values, flag))
      throw discoveryError("DISCOVERY_ARGUMENTS");
    const value = split < 0 ? args[++index] : token.slice(split + 1);
    if (!value || value.includes("\0") || (split < 0 && value.startsWith("-")))
      throw discoveryError("DISCOVERY_ARGUMENTS");
    options[values[flag]] = value;
  }
  return options;
}
export async function runDiscoveryCli(
  args,
  { cwd, display = {}, interactive = false, confirm, policyRules, budget } = {},
) {
  const json = args.includes("--json");
  const style = {
    ...display.stdout,
    ...(args.includes("--no-color") ? { color: false } : {}),
  };
  const notice = (message) => {
    const terminal = writer(style);
    terminal.line();
    terminal.line(message, "muted");
    return terminal.result();
  };
  try {
    const options = argumentsFor(args);
    if (options.help)
      return {
        exitCode: 0,
        stdout: discoveryHelp(options.command),
        stderr: "",
      };
    let output,
      exists = false;
    if (options.command === "init") {
      output =
        options.output ?? (options.publicTemplate ? ".env.example" : ".env");
      validateOutput(output);
      try {
        await inspectDestination(cwd, output);
      } catch (error) {
        if (error.code === "INIT_EXISTS" && options.dryRun) exists = true;
        else throw error;
      }
    }
    const { report, configurationKeys, templateKeys } =
      await scanProjectContext({
        root: cwd,
        rules: policyRules,
        ...(budget ? { budget } : {}),
        path: options.path,
        ...(options.template ? { template: options.template } : {}),
        ...(options.environment ? { environment: options.environment } : {}),
      });
    if (options.command === "scan" && options.templateDiff) {
      if (!report.complete) throw discoveryError("TEMPLATE_DIFF_INCOMPLETE");
      let updates;
      try {
        updates = previewTemplateUpdates(report, {
          requiredKeys: policyRules?.requiredKeys,
          templateKeys,
        });
      } catch {
        throw discoveryError("SCAN_LIMIT_EXCEEDED");
      }
      return {
        exitCode: report.policy?.failed ? 1 : 0,
        stdout: json
          ? formatJson(updates)
          : formatTemplateUpdates(updates, style),
        stderr: "",
      };
    }
    if (options.command === "scan")
      return {
        exitCode: report.complete && !report.policy?.failed ? 0 : 1,
        stdout: json
          ? formatJson(report)
          : formatDiscovery(report, { ...style, verbose: options.verbose }),
        stderr: "",
      };
    if (!report.complete) throw discoveryError("INIT_INCOMPLETE");
    let content;
    try {
      content = generateEnvTemplate(report, {
        additionalKeys: configurationKeys,
      });
    } catch {
      throw discoveryError("INIT_CONTENT_INVALID");
    }
    const standardTemplate = [".env.example", ".env.sample"].includes(
      output.toLowerCase(),
    );
    const privateEnvName = /^\.env(?:$|\.)/i.test(output) && !standardTemplate;
    const publicTemplate =
      standardTemplate || (options.publicTemplate === true && !privateEnvName);
    const ignore = publicTemplate
      ? "public-template"
      : await gitIgnoreStatus(cwd, output);
    const warnings =
      ignore === "ignored" || publicTemplate
        ? []
        : [
            "Private configuration is not confirmed ignored by Git. Add .env, .env.local and .env.*.local to .gitignore as appropriate; ConfigPilot does not edit it.",
          ];
    const unresolved = report.issues.filter(
      (issue) => issue.code === "SOURCE_DYNAMIC_REFERENCE",
    ).length;
    if (unresolved)
      warnings.push(
        `${unresolved} unresolved environment lookups were omitted. Review configpilot scan --verbose before relying on this file.`,
      );
    const preview = formatInitializationPreview(
      {
        report,
        content,
        output,
        ignore,
        warnings,
        exists,
        dryRun: options.dryRun,
      },
      { ...style, verbose: options.verbose },
    );
    const response = {
      schemaVersion: 1,
      kind: "initialization",
      status: "no-variables",
      output,
      ignore,
      warnings,
      content,
    };
    if (!content) {
      return {
        exitCode: 0,
        stdout: json
          ? formatJson(response)
          : preview +
            notice(
              "No configurable variables discovered. No file was created.",
            ),
        stderr: "",
      };
    }
    if (options.dryRun) {
      response.status = "preview";

      return {
        exitCode: 0,
        stdout: json
          ? formatJson(response)
          : preview + notice("Dry run: no file was created."),
        stderr: "",
      };
    }
    await inspectDestination(cwd, output);
    if (!options.yes) {
      if (json || !interactive || typeof confirm !== "function")
        throw discoveryError("INIT_CONFIRMATION_REQUIRED");
      if (!(await confirm(preview, "Create the previewed file? (y/N) "))) {
        response.status = "cancelled";
        return {
          exitCode: 0,
          stdout: notice("Cancelled. No file was created."),
          stderr: "",
        };
      }
    }
    await createEnvFile({ root: cwd, output, content, confirmed: true });
    response.status = "created";
    const success = formatInitializationSuccess(
      {
        output,
        publicTemplate,
        warnings,
        hasTemplate: report.configuration.template === ".env.example",
      },
      style,
    );
    return {
      exitCode: 0,
      stdout: json
        ? formatJson(response)
        : (options.verbose && options.yes ? preview : "") + success,
      stderr: "",
    };
  } catch (error) {
    const code = Object.hasOwn(ERRORS, error?.code)
      ? error.code
      : "DISCOVERY_FAILED";
    const failure = { code, message: ERRORS[code] };
    const errorStyle = {
      ...display.stderr,
      ...(args.includes("--no-color") ? { color: false } : {}),
    };
    const terminalError = formatCliError(
      {
        ...failure,
        recommendation: `Run configpilot ${args[0]} --help for safe options.`,
      },
      { ...errorStyle, command: args[0] },
    );
    return {
      exitCode: 2,
      stdout: json
        ? formatJson({
            schemaVersion: 1,
            kind: "discovery-error",
            error: failure,
          })
        : "",
      stderr: json ? "" : terminalError,
    };
  }
}
