# Troubleshooting

Start with `configpilot --version`, `node --version`, and `configpilot --help`.
From a checkout, use `node bin/configpilot.js` in place of `configpilot`.
Review only synthetic or sanitized input/output when asking for help.

## Installation and runtime

| Symptom                                                   | What to check                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `configpilot` is not found                                | Use the checkout entry point, an npm script in the consumer project, or a local global installation. The global npm executable directory must be on `PATH`; a project-local installation does not add a command to every shell.                                                                              |
| Global install fails with permissions                     | Use `node "/absolute/path/to/configpilot/bin/configpilot.js"` from your project directory, or install the local archive as a development dependency. ConfigPilot itself needs no administrative privileges.                                                                                                  |
| Registry install returns an unrelated package or an error | This project is unreleased and npm name ownership is unverified. Follow the [local installation steps](../README.md#install-locally) for this repository or its archive.                                                                                                                                     |
| ESLint fails on a runtime accepted by ConfigPilot         | Runtime support is Node 20+. Development tooling needs Node 20.19+, 22.13+, or 24+. Use a development-supported runtime for `npm ci` and lint.                                                                                                                                                               |
| Import/`require()` fails                                  | Use a `.mjs` file or a consumer with `"type": "module"`, import named exports from `"configpilot"`, and install the local archive in that consumer. No CommonJS entry point is provided; do not depend on internal module paths.                                                                             |
| TypeScript cannot find declarations                       | Reinstall the current local archive and import from `"configpilot"`. Use NodeNext resolution with an ESM consumer (`.mts`, or `.ts` with `"type": "module"`), or Bundler resolution in a bundler project. The archive includes `src/index.d.ts`; see [the API example](../README.md#use-the-javascript-api). |

Windows users should use native drive paths and quote paths with spaces, for
example `configpilot check --env "C:\work folder\.env"`. Backslashes in Windows
paths are not translated into Unix separators. Quoting rules belong to your shell.

## Operational errors: exit 2

These failures return no partial analysis. Terminal mode uses stderr; `check --json`
uses one stdout object with `schemaVersion` and `error`, leaving stderr empty.
Native messages and input paths are deliberately omitted, so inspect your local
selection without attaching the configuration to a report.

| Code                | Resolution                                                                                                                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_ARGUMENTS` | Use `configpilot check --help`. Check for unknown/duplicate options, missing paths, extra positional arguments, or mixed help/version options. `--json` is a standalone flag, not `--json=true`.                                                      |
| `FILE_NOT_FOUND`    | Verify both selected files exist relative to the current working directory. Defaults are `.env.example` and `.env`, not `.env.local`. Set explicit paths for a monorepo or different filenames. Missing inputs are not treated as empty.              |
| `FILE_NOT_READABLE` | Check local read access, target availability, and permissions for the selected regular file. A file removed or changed during reading can also fail. ConfigPilot does not request elevated privileges.                                                |
| `NOT_REGULAR_FILE`  | Select a regular file. Directories, directory symlinks, pipes, sockets, and devices are unsupported. Symlinks to regular files are followed.                                                                                                          |
| `FILE_TOO_LARGE`    | Each input must be at most 1,048,576 bytes, including any BOM. Use an appropriately scoped template/input rather than a generated bulk dump. The API has a separate UTF-16 code-unit limit.                                                           |
| `INVALID_ENCODING`  | Save the selected input as valid UTF-8. UTF-16 files are unsupported; invalid bytes are rejected instead of replaced. A UTF-8 BOM is accepted.                                                                                                        |
| `INTERNAL_ERROR`    | Retry the documented safe example on a supported runtime. If it also fails, check that the package installation includes its metadata and runtime files; reinstall the local archive if incomplete. Report persistent failures using synthetic input. |

Path options accept split or equals forms. For a filename beginning with a dash,
use `--env=-private.env` or `--env ./-private.env`. There is no `--` terminator,
stdin support, wildcard expansion inside ConfigPilot, automatic environment-file
discovery, or project configuration file. The [CLI reference](CLI.md) is the complete
argument contract.

## Analysis findings: exit 1

| Finding                 | What it means and how to proceed                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MISSING_KEY`           | The template declares a key absent from the selected environment text. It might be supplied by the deployment platform. Verify provisioning before adding or removing anything.                                                |
| `UNDOCUMENTED_KEY`      | The environment text declares a key absent from the template. Document an intentional key or review whether it is still needed.                                                                                                |
| `DUPLICATE_KEY`         | The same input declares the name more than once. Review the reported line and first declaration; keep one intentional assignment according to your application's requirements.                                                 |
| `INVALID_DECLARATION`   | Check the portable key spelling, equals sign, complete single-line quotes, and unexpected NUL characters against the [parser grammar](PARSER.md). Unsupported loader syntax may still be valid for that loader.                |
| `UNSUPPORTED_MULTILINE` | A quoted value spans physical lines. Select an input compatible with the documented grammar. Use escaped single-line representation only if your application loader handles it correctly; ConfigPilot does not convert values. |
| `COMPARISON_SKIPPED`    | At least one input has parser errors. Resolve those first. Missing/undocumented/shared counts are `null`, not zero; reported accepted-key counts can be partial.                                                               |

A missing quote can quarantine later lines to avoid exposing multiline credential
bodies as key names. If declarations appear absent, inspect the first syntax issue
and quote boundaries. Comparison cannot be forced through incomplete parsing.

## Unexpected results and CI

- **Exit 0 but the application still fails:** ConfigPilot checks declaration syntax
  and key presence, not correctness of values, requiredness, credentials, or deployment
  health. Empty values count as declarations and different values are not compared.
- **The variable is in my shell but reported missing:** the analyzer intentionally
  uses only the selected text. It does not merge `process.env`, expand references,
  or inspect a deployment platform. Verify external provisioning separately.
- **Warnings fail CI:** exit 1 is the documented review signal even when there are
  no errors. There is no severity override or warning-suppression option. Your
  integration can inspect the [JSON report](REPORT.md) and choose its own policy.
- **JSON parses but the check failed:** inspect the exit status and distinguish
  an analysis report from an operational `error` envelope. `comparison: "skipped"`
  is not a successful comparison. Avoid shell pipelines that discard the producer's
  status. See the [examples guide](https://github.com/ghazy001/configpilot/blob/main/examples/README.md).
- **Files are changing while CI reads:** checks before/after opening and bounded
  reads protect type/size boundaries but do not create atomic snapshots. Use stable
  selected inputs; ConfigPilot does not lock them.

## Ask for help safely

Open a [bug report](https://github.com/ghazy001/configpilot/issues) with the commit
or version, Node/npm versions, OS/shell, sanitized command/API call, expected and
actual exit status, and a minimal synthetic reproduction. Inspect output for
sensitive key names and paths before posting. Do not upload real environment files,
dump the process environment, or include credentials in filenames or screenshots.
For a suspected vulnerability, use [SECURITY.md](../SECURITY.md) instead.
