# Discover → configure → verify (v1.2.0)

Install with `npm install --global configpilot` or add the tool to a project with
`npm install --save-dev configpilot` and use `npx configpilot`. To pin this release,
append `@1.2.0` to the package name. Requires Node.js 20+ and npm; no account or
network access is needed while scanning/checking/initializing a local project.
No scanned code, compiler configuration, hooks or project scripts are loaded.
For a source checkout, run `npm ci --ignore-scripts`, then invoke
`node /absolute/path/to/ConfigPilot/bin/configpilot.js` from the project directory.

## First use

```sh
configpilot scan
configpilot init --template --dry-run
configpilot init --template
configpilot init
# Open .env and supply real configuration privately.
configpilot check
```

Each creation asks for consent. Generate `.env.example` first, then `.env` so the
existing check has both inputs. If a template already exists, review it rather than
overwriting it. A clean check verifies syntax and declared keys only: empty placeholders
still need manual review and values supplied externally are not inspected.

## Commands

`scan` accepts `--path DIRECTORY`, `--template FILE`, `--env FILE`, `--json`,
`--verbose`, `--no-color` and `--help`. Source scope defaults to cwd. `--path ./src`
restricts source traversal; configuration discovery remains rooted at cwd. An explicit
selected file must be a regular UTF-8 file within that root with no symlink traversal.

Automatic selection reads `.env.example`, falling back to `.env.sample`, and `.env`
when present. It lists `.env.local`, `.env.development`, and `.env.production` when
present but never reads them automatically. No arbitrary `.env.*` glob is used.
Missing environment files are normal; scan still succeeds and suggests initialization.
Invalid selected dotenv syntax disables its key comparison and makes discovery incomplete.
Explicit unreadable/invalid paths are operational failures.

The `.env.sample` fallback is for discovery and safe key copying. Default `check`
still reads `.env.example` and `.env`; it does not silently adopt scan selections.
When only `.env.sample` exists, generate `.env.example` with `init --template`
before using default `check`. Custom filenames need explicit `check --template FILE
--env FILE` selections. Scan/init next steps direct you to `check --help` in that
case rather than suggesting that default `check` will read a custom output.

`init` accepts `--path DIRECTORY`, `--template` (boolean: output `.env.example`),
`--output FILE` (overrides the default output), `--dry-run`, `--yes`, `--json`,
`--verbose`, `--no-color`, and `--help`. All flags are single-use; no positional
arguments, aliases, or unknown options are accepted. `--template FILE` is a scan
option only: init uses `--output FILE` to select a different output filename.

Without `--template`, output defaults to `.env`. Output must be a root-level filename;
parent/nested/absolute paths, symlink destinations, .gitignore/.npmrc, Windows device
names, and trailing-dot/space filenames are refused. `--dry-run` previews
only and can preview even if an output already exists. Creation refuses an existing
file, directory, or dangling link. `--yes` grants creation of a nonexistent file only.
In non-TTY and JSON mode, creation requires `--yes`; no prompt is emitted. EOF, interruption and a two-minute idle deadline default to No. Known CI indicators
disable interactive prompts even with a TTY. Cancellation and no source/selected
configuration keys create nothing. Incomplete scans block creation. Confirmation
uses ordinary line input, without requiring raw terminal mode; setup/output failures
cancel safely rather than authorizing creation.

Preview/JSON content contains only generated comments, names, empty values, and fixed
safe development placeholders. Existing values and source fallback literals are never
copied. Only discovered PORT gets `3000` and NODE_ENV gets `development`; these are
editable development hints, not inferred defaults or production recommendations.
Other keys are empty; framework-provided import.meta flags are omitted unless already
explicitly selected in a configuration file. CLI generation preserves the union of
source and selected template/local key names, never their values. Keys are sorted
and deduplicated. Files are exclusively created with mode 0600 (subject to OS support).
Windows ACL inheritance still applies. A failed write can leave a partial newly created
file; ConfigPilot reports failure and asks you to inspect it rather than deleting a path
that might have been replaced. Never trust a partially written file.

Private output not confirmed ignored by Git produces a warning. Add appropriate rules
manually, such as `.env`, `.env.local`, and `.env.*.local`. ConfigPilot never edits
.gitignore or stages/commits/pushes output. Public `.env.example`/`.env.sample` templates
have safe placeholders and may be committed after review. `--template` marks a custom
output as a public template except `.env` and any `.env.*` variant other than
`.env.example`/`.env.sample`; private filename roles take precedence. Git-ignore inspection uses native `git check-ignore` with
hooks and fsmonitor disabled; tracked paths are not treated as safely ignored. Missing Git or unavailable ignore information is reported
as unknown. Global/info exclude behavior is delegated to Git. No project code is run.

## Static analysis and classification

Supported: `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.mts`, `.cts`, `.tsx` source; direct
`process.env.NAME`, quoted brackets, optional member syntax and `import.meta.env.NAME`.
Comments and unrelated strings are ignored by AST parsing. Constant bracket templates
without expressions, such as process.env[`API_KEY`], are static keys. Computed nonliteral keys
are unresolved; expressions are never evaluated. Only portable names up to 128 ASCII
characters are returned. No source excerpts or literal/default values appear in results.
String/number/boolean/null literals directly on the right of `??` or `||` count as a
static fallback; this does not prove optionality at every call site. Logical && is
not a fallback. Defaults behind known TypeScript/parenthesized wrappers are recognized.

Names determine purpose/category, medium/low confidence, and potential sensitivity.
A name is not evidence of a real secret. Public-prefixed sensitive names need particular
review because bundlers may expose them. import.meta.env DEV/PROD/MODE/SSR/BASE_URL are
marked framework-provided and omitted from generation and missing-key findings.
Other references may be optional, conditional or externally injected; potentiallyRequired
means at least one observed reference lacks a recognized fallback, not a proven runtime
requirement. Mixed references retain both fallback and potentiallyRequired information.

Lexical bindings distinguish global process, local shadows and builtin process imports
(including ordinary CommonJS require). Immutable direct aliases, alias chains up to
32 bindings, and static object destructuring are supported. TS expression wrappers
are unwrapped for fallback detection; values are never evaluated. Escaped environment
objects and mutable aliases produce unresolved findings rather than guessed keys.
No interprocedural/control-flow analysis, process reassignment tracking, dotenv
loader evaluation or framework build execution is implemented. Babel handles ordinary JS/TS/JSX/TSX syntax; unsupported
proposals or malformed files return sanitized parse issues without recovered key guesses.
Legacy decorator syntax (including ordinary NestJS controllers) is parsed without
invoking decorators; complete proposal/framework compatibility is not promised.
Vue `.vue`, Svelte `.svelte` and Astro `.astro` components cause explicit incomplete
scan findings, and block initialization. Nuxt useRuntimeConfig, template expressions
and custom framework config semantics are not supported. Frameworks are not detected
from installed packages or project plugins: classifications are syntax/name heuristics.
NODE_ENV is retained as a discovered application key; frameworks may supply it, but
ConfigPilot does not assume a standalone Node process has it configured. Next/Express/React/Vite source can use
supported patterns; no complete framework compatibility is claimed. Hidden paths and
`.d.ts` files are excluded as well as generated/dependency trees.

## Reports and exits

Existing `check --json` report/schema/issue codes and exit contract are unchanged.
`scan --json` produces a separate `{schemaVersion:1, kind:"discovery", complete,
filesScanned, bytesScanned, variables, issues, configuration}` object. Variable entries
include name, references (file/line/syntax/notation/fallback boolean), referenceCount,
category, purpose, confidence, frameworkProvided, potentiallySensitive,
potentiallyRequired, hasStaticFallback, inTemplate and inEnvironment. Presence is null
when no trustworthy selected input exists. JSON is deterministic for stable inputs;
no duration, absolute root, source snippets or configuration values are retained.

Discovery issue codes:

| Code                      | Meaning                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| SOURCE_DYNAMIC_REFERENCE  | Key is unresolved; no expression text is reported.                |
| SOURCE_PARSE_ERROR        | A file could not be parsed; scan incomplete (warning).            |
| SOURCE_SKIPPED            | Unreadable/binary/oversized/resource-bounded source; incomplete.  |
| SOURCE_SYMLINK_SKIPPED    | Link skipped by scan policy; no traversal.                        |
| SOURCE_CONFIG_INVALID     | Selected dotenv syntax cannot support comparison.                 |
| SOURCE_UNDOCUMENTED_KEY   | Referenced name absent from selected template.                    |
| SOURCE_MISSING_LOCAL_KEY  | Potentially needed name absent locally; may be external/optional. |
| SOURCE_OPTIONAL_REFERENCE | At least one static fallback observed.                            |
| SOURCE_POTENTIAL_SECRET   | Name suggests sensitivity, not proof of a leaked secret.          |

All discovery findings are informational except parse warnings. Scan exits 0 for a
complete scan (even with informational findings), 1 for an incomplete scan, 2 for
arguments/operational/resource-limit failure. Init exits 0 for created, preview,
cancelled or no-variables results; 2 for failure. Init JSON has schemaVersion 1,
kind initialization, status, output, ignore, warnings and generated content. Failures
use `{schemaVersion:1, kind:"discovery-error", error:{code,message}}` on stdout in JSON
mode, otherwise sanitized stderr. JSON has no headers, ANSI or interactive prompts.
CLI operational codes include DISCOVERY_ARGUMENTS, SCAN_PATH_INVALID, SCAN_READ_FAILED,
SCAN_LIMIT_EXCEEDED, SCAN_CONFIG_INVALID, INIT_EXISTS, INIT_OUTPUT_INVALID,
INIT_CONFIRMATION_REQUIRED, INIT_CONTENT_INVALID, INIT_INCOMPLETE, INIT_WRITE_FAILED,
and DISCOVERY_FAILED. Public errors expose stable codes, never native exception text.

## API

```js
import {
  scanSource,
  scanProject,
  generateEnvTemplate,
  createEnvFile,
} from "configpilot";
const extracted = scanSource("process.env.PORT ?? 3000", { file: "server.ts" });
const report = await scanProject({ root: "/path/to/project", path: "src" });
const content = generateEnvTemplate(report); // pure; requires complete report
// Only after obtaining your own application's explicit user confirmation:
await createEnvFile({
  root: "/path/to/project",
  output: ".env",
  content,
  confirmed: true,
});
```

The filesystem API does not prompt; the caller must obtain consent before confirmed:true. Optional generation additionalKeys
lets an application preserve selected portable names without supplying any values.
scanSource is synchronous and bounded but runs in the caller's process. scanProject
uses a 96 MiB parser worker with a 2-second per-file deadline; traversal has a 30-second
budget. No source code is executed in the worker. Generation returns an empty string
for no configurable names; createEnvFile refuses empty content. Errors contain fixed
messages/codes. No ambient process.env keys are used as application configuration.

Limits: 1000 source files, 5000 directory entries, depth 32, 256 KiB per source,
8 MiB total source bytes, 4096 references/unresolved entries, 8192 diagnostics,
1024-character source labels and 256 KiB generated content. Limits fail safely with
no creation. Existing dotenv 1 MiB and metadata limits remain. Large projects can
select a narrower --path. Directory links and excluded trees are never followed.
Concurrent hostile replacement of root/ancestor directories is outside the supported
filesystem boundary; Node path APIs do not offer portable directory-descriptor writes.

## Captured terminal examples — 2026-10-27, reference layout

Actual output from isolated synthetic inputs: server.ts references PORT with a fallback,
DATABASE_URL, OPENAI_API_KEY, import.meta.env.DEV and a dynamic key; the template
declares PORT and DATABASE_URL and the local file declares only PORT. These examples
show non-TTY ASCII output; supported TTYs use color and Unicode borders. No configuration
values are copied into reports or generated files.

### Scan (exit 0)

```sh
configpilot scan --no-color
```

```text
  > ConfigPilot                                                         [ SCAN ]
  Environment discovery

  ------------------------------------------------------------------------------

  [ok] Scan completed                                                 [ 1 FILE ]

  +-----------------------+  +-----------------------+  +----------------------+
  |           0           |  |           0           |  |          7           |
  |        Errors         |  |       Warnings        |  |     Information      |
  +-----------------------+  +-----------------------+  +----------------------+

  4 variables / 2 potential secrets / 1 with defaults
  1 unresolved lookups need review. No variable names were guessed.
    Template:    ".env.example"
    Local:       ".env"

  Discovered variables                                                [ STATUS ]

  > DATABASE_URL                                            [ Potential secret ]
    Source:      "server.ts":1
    Message:     Potential secret / No local declaration; may be external
    Action:      Supply real credentials privately; keep template values empty.

  > DEV                                                            [ Framework ]
    Source:      "server.ts":1
    Message:     Framework-provided
    Action:      Document this key in the selected template if intentional.

  > OPENAI_API_KEY                                          [ Potential secret ]
    Source:      "server.ts":1
    Message:     Potential secret / Not documented / No local declaration; may
                 be external
    Action:      Supply real credentials privately; keep template values empty.

  > PORT                                                    [ Default detected ]
    Source:      "server.ts":1
    Message:     Static fallback observed
    Action:      Review the fallback in source before deciding whether to set
                 this key.

  Scan notes

  SOURCE_DYNAMIC_REFERENCE                                              [ INFO ]
    Message:     Environment lookup or object use could not be resolved to
                 individual keys. Review this location; no expression text was
                 retained.
    Source:      "server.ts":1

  ------------------------------------------------------------------------------

  +----------------------------------------------------------------------------+
  | Next Steps                                                                 |
  |                                                                            |
  | Review configuration consistency. Values and runtime provisioning are not  |
  | validated.                                                                 |
  |                                                                            |
  | > configpilot check                                                        |
  +----------------------------------------------------------------------------+

  Static references are not proof of requiredness. No files were modified.
```

### Init preview (exit 0; existing template protected)

```sh
configpilot init --template --dry-run --no-color
```

```text
  > ConfigPilot                                                         [ INIT ]
  Safe environment initialization

  ------------------------------------------------------------------------------

  Configuration preview ready                                         [ EXISTS ]

  +-----------------------+  +-----------------------+  +----------------------+
  |           0           |  |           1           |  |          7           |
  |        Errors         |  |       Warnings        |  |     Information      |
  +-----------------------+  +-----------------------+  +----------------------+

  3 placeholders / 2 potential secrets
  4 names discovered in source; selected configuration keys are retained.

    Destination: ".env.example"
    Protection:  Already exists; preview only, never overwritten.
    Git status:  Public template: safe placeholders only
    Safety:      1 unresolved environment lookups were omitted. Review
                 configpilot scan --verbose before relying on this file.

  Safe configuration preview                                    [ PLACEHOLDERS ]

  DATABASE_URL=
  OPENAI_API_KEY=
  PORT=3000

  Empty values need review. Development hints are not production defaults.

  +----------------------------------------------------------------------------+
  | Next Steps                                                                 |
  |                                                                            |
  | Existing files are protected. Review a different destination with          |
  | --output; no overwrite is available.                                       |
  |                                                                            |
  | > configpilot init --help                                                  |
  +----------------------------------------------------------------------------+

  Dry run: no file was created.
```

### Check (exit 1)

```sh
configpilot check --no-color
```

```text
  > ConfigPilot                                                        [ CHECK ]
  Environment configuration diagnostics

  ------------------------------------------------------------------------------

  ! Analysis completed                                                [ REVIEW ]

  +-----------------------+  +-----------------------+  +----------------------+
  |           0           |  |           1           |  |          0           |
  |        Errors         |  |       Warnings        |  |     Information      |
  +-----------------------+  +-----------------------+  +----------------------+

    Template:    ".env.example"
    Target:      ".env"

  Configuration diagnostics                                           [ STATUS ]

  [!] DATABASE_URL                                                   [ WARNING ]
    Finding:     Missing variable [MISSING_KEY]
    Location:    template ".env.example":2
    Message:     No local declaration was found. This key may be supplied
                 externally.
    Action:      Provide it locally or verify deployment provisioning before
                 changing files.

  ------------------------------------------------------------------------------

  Summary
  0 errors, 1 warning, 0 info.
  Comparison: complete
  Keys: 2 template, 1 environment; 1 shared, 1 missing, 0 undocumented.

  +----------------------------------------------------------------------------+
  | Next Steps                                                                 |
  |                                                                            |
  | Review the locations and actions above. Rerun your selected check after    |
  | making intentional changes.                                                |
  |                                                                            |
  | > configpilot check                                                        |
  +----------------------------------------------------------------------------+

  Configuration needs attention.
  No files were modified.
```

### Missing file (exit 2, stderr)

```sh
configpilot check --env missing.env --no-color
```

```text
  > ConfigPilot                                                        [ CHECK ]
  Environment configuration assistance

  ------------------------------------------------------------------------------

  Command could not complete                                           [ ERROR ]

  +-----------------------+  +-----------------------+  +----------------------+
  |           1           |  |           0           |  |          0           |
  |        Errors         |  |       Warnings        |  |     Information      |
  +-----------------------+  +-----------------------+  +----------------------+

    Finding:     FILE_NOT_FOUND
    Input:       environment
    Message:     Selected input file was not found.
    Action:      Check the selected path and working directory, then rerun.

  +----------------------------------------------------------------------------+
  | Next Steps                                                                 |
  |                                                                            |
  | Check the selected path and working directory. Example:                    |
  |                                                                            |
  | > configpilot check --template .env.example --env .env                     |
  +----------------------------------------------------------------------------+
```

## Terminal presentation and accessibility

Scan shows the first source location by default, aligned classification/status
badges, explicit public-sensitive warnings, and a next step chosen from selected file
presence. Normal output shows at most 30 variable rows and 20 scan notes; --verbose
or --json retain complete findings. Counts describe all records, not only shown rows.
Init shows placeholder count, potential-sensitive-name count, destination protection,
Git status and up to 12 safe placeholder assignments (all with --verbose). --yes
shows a concise success screen; full preview is available with --verbose/--dry-run.
Check groups errors, warnings and information, retaining diagnostic codes and source
locations. Terminal wording is concise; analyzer/JSON messages remain unchanged.
All commands share Errors / Warnings / Information metric cards, aligned detail
fields and a highlighted Next Steps command panel. Scan cards count diagnostic records;
init preview includes discovery records and safety warnings; creation success shows
creation safety notices. Several diagnostics can concern the same variable. The three
cards stack below 54 available cells and use plain labels below 24 available cells.
The 4–160-column layout (default 80) includes ASCII fallback and
stream-specific NO_COLOR/--no-color/TERM=dumb policies. Color never carries meaning
alone; no spinners or progress animations are emitted in CI. Unicode cell widths are
estimated, so fonts/terminals can differ; native platform CI results are recorded in the release progress log. Manual font/terminal appearance review remains separate.
