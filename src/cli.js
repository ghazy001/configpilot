const HELP = `ConfigPilot — Explainable environment-configuration diagnostics

Usage:
  configpilot --help
  configpilot --version

Options:
  --help       Show this help message.
  --version    Show the package version.

Development status: parsing and comparison available through the JavaScript API.
The check command and CLI reports are not implemented yet.
`;

/** Resolve CLI arguments without accessing files, streams, or the environment. */
export function runCli(args, { version }) {
  if (args.length === 0 || (args.length === 1 && args[0] === "--help")) {
    return { exitCode: 0, stdout: HELP, stderr: "" };
  }

  if (args.length === 1 && args[0] === "--version") {
    return { exitCode: 0, stdout: `${version}\n`, stderr: "" };
  }

  const message =
    args[0] === "check"
      ? "The check command is not implemented yet. Use the JavaScript analysis API."
      : "Unsupported command or arguments.";

  // Never echo arguments: an accidental argument may contain a credential.
  return {
    exitCode: 2,
    stdout: "",
    stderr: `ConfigPilot: ${message}\nRun configpilot --help for available commands.\n`,
  };
}
