# ConfigPilot CLI

Requires Node.js 20+. From the checkout, run `node bin/configpilot.js`; a local
installation also provides the `configpilot` executable. Version 1.0.0 defines the
stable CLI contract. No command changes configuration files or executes their
contents, project scripts, or project-provided configuration modules.

```sh
configpilot check
configpilot check --template .env.example --env .env
configpilot check --json
configpilot check --help
configpilot --help
configpilot --version
```

## Arguments and paths

| Option            | Meaning                                               |
| ----------------- | ----------------------------------------------------- |
| `--template PATH` | Reference dotenv file; default `.env.example`.        |
| `--env PATH`      | Actual dotenv file; default `.env`.                   |
| `--json`          | Output one JSON object instead of terminal text.      |
| `--help`          | Show usage; accepted standalone or as `check --help`. |
| `--version`       | Show package version; accepted standalone.            |

No arguments displays help. Path options also support `--template=PATH` and
`--env=PATH`, including paths containing equals signs. Quote paths containing spaces
using your shell's quoting rules. Absolute paths and relative paths are accepted;
relative paths resolve from the **current working directory**, not the package's
installation directory. Native Windows separators and drive paths work on Windows;
backslashes are not reinterpreted as separators on Unix.

Each option may appear only once. Unknown commands/options, bare positional
arguments, empty/NUL paths, missing values, mixed help/version invocations, and
`--json=true` fail with exit 2 before any configuration reads. A path starting with
a dash must use an equals form such as `--env=-private.env` or a relative `./` prefix.
There are no short aliases, stdin input, `--` terminator, glob expansion, automatic
file discovery, path interpolation, policy files, or environment-variable fallback.
The shell may independently expand or retain arguments; never pass credentials.

## Exit codes and streams

| Code | Contract                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| `0`  | A complete analysis has no warnings/errors, or help/version succeeded.                                                       |
| `1`  | The analysis report contains warnings or errors, including skipped comparison due to parser errors. Review the findings.     |
| `2`  | Invalid arguments, input access/type/encoding/size failure, or another operational failure. No partial analysis is returned. |

Warnings intentionally make checks nonzero for CI review. They retain their
existing severity: a missing local key may be supplied externally and does not
prove a deployment is broken. No severity override or warning-suppression flag
is introduced. See [the report contract](REPORT.md) for all analysis semantics.

Analysis reports, including errors found **inside** a configuration file, use
stdout. Help/version use stdout. Terminal usage/read failures use stderr and leave
stdout empty. No progress chatter, prompts, or native exception stacks are emitted.
Terminal styling follows the display policy below. Closed output pipes are handled
without an uncaught stack trace.

## JSON output

Successful reads produce the **unchanged report schema version 1** from
`analyzeConfig`, including `comparison`, `issues`, and `summary`. Exit 1 still
produces that report. Parse it using a JSON parser and inspect the exit status;
do not assume that valid JSON means a clean or complete comparison.

Operational failures in JSON mode use a separate envelope, also with version 1:

```json
{
  "schemaVersion": 1,
  "error": {
    "code": "FILE_NOT_FOUND",
    "source": "template",
    "message": "Selected input file was not found.",
    "recommendation": "Check the selected path and working directory, then rerun."
  }
}
```

This object is written to stdout with exit 2 and empty stderr. `source` is the
input role (`template` or `environment`) for read failures and is omitted for
argument/internal failures. There is no `issues`, `summary`, or partial report.
Error text is fixed and does not echo paths, arbitrary arguments, native errors,
raw lines, or values. Known option names may appear in usage guidance.

To select JSON for argument errors, the request must begin with `check` and contain
a standalone `--json` token, even if another argument is invalid. For example,
`check --json --env` produces a JSON usage error. `--json unknown` is a terminal
usage error, since it is not a `check` request. Help/version cannot be mixed with JSON.

| Operational code    | Action                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `INVALID_ARGUMENTS` | Read help and correct the command or option values.                   |
| `FILE_NOT_FOUND`    | Check the selected path and current working directory.                |
| `FILE_NOT_READABLE` | Check permissions and access to the selected file.                    |
| `NOT_REGULAR_FILE`  | Select a regular file rather than a directory, pipe, or device.       |
| `FILE_TOO_LARGE`    | Keep each selected file within 1,048,576 bytes.                       |
| `INVALID_ENCODING`  | Save the configuration as valid UTF-8.                                |
| `INTERNAL_ERROR`    | Retry supported inputs and report persistent failures without values. |

These operational codes are CLI-specific; `ISSUE_CODES` continues to describe the
six analysis diagnostics only. JSON escapes control/format characters in labels
without changing the data obtained through `JSON.parse`.

## File and privacy boundaries

Only the two selected inputs are opened for reading. Missing files are errors;
they are not silently treated as empty configurations. Symlinks to regular files
are followed. Directories, symlinks to directories, devices, FIFOs, and sockets
are rejected. File types are checked before opening and on the opened descriptor;
nonblocking open flags are used where supported to protect against FIFO races.

Each file is limited to **1,048,576 bytes** (1 MiB), including a UTF-8 BOM. The
reader checks size and bounds the read to the limit plus one detection byte, so
growth cannot cause an unbounded read. Invalid UTF-8 is rejected instead of being
silently replaced. UTF-8 BOM and CRLF/CR/LF input are supported. The library parser
has a separate limit in UTF-16 code units; the CLI's byte limit is intentionally
stricter for multibyte text. No temporary configuration copies are created.

Reads are not atomic snapshots of files being edited concurrently. Use stable
inputs in CI. File permissions and operating-system I/O behavior still apply.
Source contents are used only for parsing and are absent from reports. Public
file labels preserve the supplied option paths; terminal output quotes and escapes
control/format characters to prevent them from injecting terminal commands or
spoofing output lines. Names and labels are public metadata, not secret-scanned.

The [parser subset and multiline recovery](PARSER.md) remain unchanged. Syntax
errors suppress key differences rather than creating misleading findings from
partial input. The CLI never reads runtime variables to fill missing declarations.

## Try a safe mismatch

The checkout includes two `.txt` files with synthetic values; the parser does not
require a particular filename extension:

```sh
node bin/configpilot.js check --template examples/reference.txt --env examples/environment.txt
```

It reports `DATABASE_URL` as missing, `REDIS_URL` as undocumented, and `PORT` as
shared. The summary is 0 errors and 2 warnings, and the exit code is **1**.
Append `--json` for the same findings in report schema 1. No files are modified.

See [troubleshooting](TROUBLESHOOTING.md) for installation, operational failures,
parser recovery, and CI questions. Source-checkout scenarios and a runnable library
example are in the [examples guide](https://github.com/ghazy001/configpilot/blob/main/examples/README.md).

## Resource limits

The [parser budgets](PARSER.md#resource-budgets) also apply to CLI input: 2,048
recognized declarations/invalid lines, 4,096-code-unit labels and 131,072-code-unit
aggregate key/label metadata per input. Exceeding them returns exit 2 with
`INPUT_LIMIT_EXCEEDED`, no partial report, and no source/native error text. The JSON
form follows the operational envelope above. These limits prevent dense small files
from generating excessive logs or allocations; they do not validate assignment values.

## Terminal display (v1.1.0)

Version 1.0.0 has the earlier plain layout. Version 1.1.0 keeps the public API,
JSON schema, severities, codes, and exits unchanged. Human-readable layout is not a
machine parsing contract; use `--json` for automation.

| Option       | Behavior                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-color` | Disable all ANSI styling, including bold and dim, even with FORCE_COLOR.                                                                           |
| `--quiet`    | Omit branding, summary, and footer; retain every finding, location, and action. Clean checks produce no output. Operational errors remain visible. |
| `--verbose`  | Add schema and analysis-scope information; never values, source excerpts, or native exceptions.                                                    |

These boolean options belong to `check`; repeats and equals-value forms are invalid.
`--quiet` and `--verbose` are mutually exclusive (exit 2). Display options are ignored
by JSON rendering, including operational JSON errors; output remains byte-identical.
Help and version remain concise plain text.

Color precedence: `--no-color`, nonempty `NO_COLOR`, `TERM=dumb`, and
`FORCE_COLOR=0` disable ANSI. Otherwise `FORCE_COLOR` set to an empty string, 1, 2,
or 3 enables the restrained 16-color palette even when redirected. By default each
output stream is colored only when that stream is a TTY. Other FORCE_COLOR values
do not force color. GitHub Actions and other redirected CI output default to ASCII
without ANSI unless explicitly forced.

Unicode symbols require a TTY, a non-dumb terminal, and a UTF-8 locale, a terminal
program indicator, or Windows Terminal's WT_SESSION. Other terminals use ASCII
markers; severity words and stable issue codes remain visible in every mode.
PowerShell outside Windows Terminal can therefore use the readable ASCII fallback.
No font detection is attempted. Both streams wrap independently to their terminal
width (4–100 columns; default 80), with stacked details and no box borders. Very
narrow widths split long keys and paths; use JSON to obtain their exact spelling.
CJK and emoji widths are estimated; unusual fonts may render them differently.
Paths are quoted and control characters escaped. Operational failures deliberately
omit raw paths and arguments because those may themselves contain sensitive data.

### Reproduce the display

The following examples use synthetic values and plain output. In the checkout,
replace `configpilot` with `node /absolute/path/to/ConfigPilot/bin/configpilot.js`.
Prepare `.env.example` containing `PORT=3000` and `.env` containing `PORT=4000`.

### Successful check (exit 0)

```sh
configpilot check --no-color
```

```text
  > ConfigPilot
  Environment Configuration Diagnostics

  Template  ".env.example"
  Target    ".env"

  [ok] No configuration issues found.
  Syntax and declared keys match. Values and deployment configuration were not
  validated.

  Summary
  0 errors, 0 warnings, 0 info.
  Comparison: complete
  Keys: 1 template, 1 environment; 1 shared, 0 missing, 0 undocumented.

  No files were modified.
```

### Warnings (exit 1)

Set `.env` to `OTHER=example`.

```sh
configpilot check --no-color
```

```text
  > ConfigPilot
  Environment Configuration Diagnostics

  Template  ".env.example"
  Target    ".env"

  2 configuration issues found

  [!] WARNING  Missing variable
  PORT [MISSING_KEY]
  Location: template ".env.example":1
  Template variable has no declaration in the environment input. It may be
  supplied externally.
  Action: Provide this key locally or through the deployment environment. Verify
  external provisioning before changing files.

  [!] WARNING  Undocumented variable
  OTHER [UNDOCUMENTED_KEY]
  Location: environment ".env":1
  Environment variable is not documented in the reference template.
  Action: Document this key in the reference template if intentional, or review
  whether it is still needed.

  Summary
  0 errors, 2 warnings, 0 info.
  Comparison: complete
  Keys: 1 template, 1 environment; 0 shared, 1 missing, 1 undocumented.

  Configuration needs attention.
  No files were modified.
```

### Syntax error and skipped comparison (exit 1)

Set `.env` to `invalid`.

```sh
configpilot check --no-color
```

```text
  > ConfigPilot
  Environment Configuration Diagnostics

  Template  ".env.example"
  Target    ".env"

  2 configuration issues found

  [x] ERROR  Invalid declaration
  INVALID_DECLARATION
  Location: environment ".env":1
  Declaration does not match the supported dotenv syntax.
  Action: Use NAME=value with a portable variable name and complete single-line
  quotes. Check the documented parser syntax.

  [i] INFO  Key comparison skipped
  COMPARISON_SKIPPED
  Key comparison was skipped because at least one input could not be parsed
  completely.
  Action: Resolve syntax errors and unsupported constructs in both inputs, then
  run the comparison again.

  Summary
  1 error, 0 warnings, 1 info.
  Comparison: skipped
  Keys: 1 template, 0 environment (partial); differences unavailable.

  Configuration needs attention.
  No files were modified.
```

### Missing file (exit 2, stderr)

```sh
configpilot check --env missing.env --no-color
```

```text
  [x] ConfigPilot: FILE_NOT_FOUND (environment)

  Selected input file was not found.
  Action: Check the selected path and working directory, then rerun.

  Example: configpilot check --template .env.example --env .env
```

### JSON success (exit 0)

Set `.env` to `PORT=4000`.

```sh
configpilot check --json
```

```json
{
  "schemaVersion": 1,
  "comparison": "complete",
  "issues": [],
  "summary": {
    "errors": 0,
    "warnings": 0,
    "info": 0,
    "total": 0,
    "templateKeys": 1,
    "environmentKeys": 1,
    "sharedKeys": 1,
    "missingKeys": 0,
    "undocumentedKeys": 0
  }
}
```
