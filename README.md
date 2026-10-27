# ConfigPilot

**Explainable environment-configuration diagnostics for developers and CI.**

ConfigPilot helps you configure an unfamiliar JavaScript or TypeScript project:
discover environment-variable references, generate safe editable placeholders with
permission, and check configuration consistency without displaying secret values.

**v1.3.0** adds explicit JSON project rules, CI failure policies, required-local
blank checks, safe template-addition previews, Vue script-block discovery,
independent workspaces, GitHub annotations and exported JSON Schemas.
The existing default commands, analysis API, JSON schema and exit policy remain
compatible. Runtime: **Node.js 20+**, ES modules. License: [MIT](LICENSE).
See [the project workflows guide](docs/PROJECT_WORKFLOWS.md) for commands,
security boundaries and supported Vue syntax.

## Discover → configure → verify

After installation, run these commands in your project directory:

```sh
configpilot scan
# If .env.example does not exist:
configpilot init --template
# If .env does not exist:
configpilot init
# Open .env and fill required values privately.
configpilot check
```

Use `configpilot init --template --dry-run` to preview a reference template first.
Existing files are protected: review them instead of regenerating them. `check`
compares `.env.example` with `.env`; custom inputs use `--template` and `--env`.
A successful check validates syntax and declared keys, not placeholder values or
runtime readiness. Missing local variables may be supplied by your deployment.

Scan supports JavaScript, TypeScript, JSX and TSX, including direct members,
immutable aliases and static destructuring. Dynamic references stay unresolved;
Vue inline script blocks are supported; template expressions stay unresolved.
Svelte/Astro components and unsupported Vue script formats make a scan incomplete
and block init.
No scanned project code is executed. Values/fallback literals are never copied,
and creation requires consent or `--yes` for a nonexistent file only.
See [the complete workflow, options and API](docs/SOURCE_DISCOVERY.md) for selection
rules, limits, classifications, JSON output, exit codes and supported syntax.

## Install

For the CLI:

```sh
npm install --global configpilot
configpilot --help
```

For a project's development scripts:

```sh
npm install --save-dev configpilot
```

For an application importing the JavaScript API at runtime, use
`npm install configpilot` instead. These commands install the latest release.
To pin v1.3.0 explicitly, append `@1.3.0` to the package name. No extra installation flags are required.
Source discovery uses pinned Babel and Vue SFC parser dependencies.
ConfigPilot has no install lifecycle scripts.

Add `"config:check": "configpilot check"` to your npm scripts, then run
`npm run config:check` from the project containing `.env.example` and `.env`.
The [npm package](https://www.npmjs.com/package/configpilot) and
[changelog](CHANGELOG.md)
identify the distribution. Source-checkout and archive alternatives are below.

## Try it in one minute

With Git and Node.js 20+ installed:

```sh
git clone https://github.com/ghazy001/configpilot.git
cd configpilot
node bin/configpilot.js check --template examples/reference.txt --env examples/environment.txt
```

Run `npm ci --ignore-scripts` in the checkout first; no build is needed. The supplied files
contain synthetic values. The command exits **1** because it finds two warnings:

```text
  > ConfigPilot                                                        [ CHECK ]
  Environment configuration diagnostics

  ------------------------------------------------------------------------------

  ! Analysis completed                                                [ REVIEW ]

  +-----------------------+  +-----------------------+  +----------------------+
  |           0           |  |           2           |  |          0           |
  |        Errors         |  |       Warnings        |  |     Information      |
  +-----------------------+  +-----------------------+  +----------------------+

    Template:    "examples/reference.txt"
    Target:      "examples/environment.txt"

  Configuration diagnostics                                           [ STATUS ]

  [!] DATABASE_URL                                                   [ WARNING ]
    Finding:     Missing variable [MISSING_KEY]
    Location:    template "examples/reference.txt":1
    Message:     No local declaration was found. This key may be supplied
                 externally.
    Action:      Provide it locally or verify deployment provisioning before
                 changing files.

  [!] REDIS_URL                                                      [ WARNING ]
    Finding:     Undocumented variable [UNDOCUMENTED_KEY]
    Location:    environment "examples/environment.txt":2
    Message:     This local key is absent from the reference template; setup
                 instructions may be incomplete.
    Action:      Document it if intentional, or review whether it is still used.

  ------------------------------------------------------------------------------

  Summary
  0 errors, 2 warnings, 0 info.
  Comparison: complete
  Keys: 2 template, 2 environment; 1 shared, 1 missing, 1 undocumented.

  +----------------------------------------------------------------------------+
  | Next Steps                                                                 |
  |                                                                            |
  | Review the locations and actions above. Rerun your selected check after    |
  | making intentional changes.                                                |
  |                                                                            |
  | > configpilot check --help                                                 |
  +----------------------------------------------------------------------------+

  Configuration needs attention.
  No files were modified.
```

A missing declaration may be provided by your deployment platform. Review the
recommendation before changing files; ConfigPilot does not inspect runtime provisioning.

## Install locally

For an executable available outside the checkout, run this from the cloned repository:

```sh
npm install --global .
configpilot --help
configpilot --version
```

Your npm global executable directory must be on `PATH`. If installation needs
administrator access, use the checkout command with an absolute path instead;
see [installation troubleshooting](docs/TROUBLESHOOTING.md#installation-and-runtime).

For a project's development dependency or library consumer, build an archive in
the checkout with `npm pack --ignore-scripts`. Then, from the consumer project:

```sh
npm install --save-dev "/absolute/path/to/configpilot/configpilot-1.3.0.tgz"
```

Replace the archive path with your actual path, using native Windows paths on
Windows. A local dependency provides `configpilot` inside npm scripts; for example,
`"config:check": "configpilot check"`. These installations do not publish anything.

## Check your configuration

From the directory containing `.env.example` and `.env`, after installing the CLI:

```sh
configpilot check
configpilot check --template .env.example --env ".env.local" --json
```

Paths resolve from the working directory. Without an installation, replace
`configpilot` with `node "/absolute/path/to/configpilot/bin/configpilot.js"`.
Both inputs must exist and be regular UTF-8 files, at most **1 MiB each**.
ConfigPilot also bounds declarations and public metadata; see the
[resource budgets](docs/PARSER.md#resource-budgets).

| Option            | Meaning                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `--template PATH` | Reference file; default `.env.example`. Also accepts `--template=PATH`. |
| `--env PATH`      | Environment file; default `.env`. Also accepts `--env=PATH`.            |
| `--json`          | One JSON object on stdout, including safe operational errors.           |
| `--help`          | Standalone or `check --help`; no arguments also shows help.             |
| `--version`       | Package version; standalone only.                                       |

| Exit | Meaning                                                                       |
| ---- | ----------------------------------------------------------------------------- |
| `0`  | No analysis warnings/errors, or help/version succeeded.                       |
| `1`  | Analysis has warnings or errors; review the report.                           |
| `2`  | Invalid arguments, unreadable/unsupported input file, or operational failure. |

Warnings intentionally make CI checks nonzero. In JSON mode, inspect both the exit
status and the object: analysis has `comparison`, `issues`, and `summary`; operational
failure has `error` and no partial report. Syntax errors set `comparison` to `skipped`
and difference counts to `null`. Valid JSON alone does not mean a clean check.
Interactive terminals use restrained colors and supported Unicode symbols. Redirected
output defaults to plain ASCII. Use `--no-color` or nonempty `NO_COLOR` to disable
ANSI styling. `--quiet` retains findings but makes clean checks silent; `--verbose`
adds analysis-scope details without exposing values. These display options are available starting in v1.1.0. See [the CLI reference](docs/CLI.md) for arguments, streams, error codes,
and file handling, or [troubleshooting](docs/TROUBLESHOOTING.md) for a specific failure.

## Use the JavaScript API

Save this as an `.mjs` file in a consumer project with the package installed,
or in this checkout, then run it with Node.js:

```js
import { analyzeConfig, parseDotenv, ISSUE_CODES } from "configpilot";

const report = analyzeConfig({
  template: "DATABASE_URL=example\nPORT=3000",
  environment: "PORT=4000\nREDIS_URL=example",
});

console.log(report.comparison); // complete
console.log(report.summary.warnings); // 2
console.log(report.issues[0].code === ISSUE_CODES.MISSING_KEY); // true

const parsed = parseDotenv("PORT=3000\nPORT=4000", { file: ".env" });
console.log(parsed.declarations.length); // 2 (all valid occurrences)
console.log(parsed.issues[0].code); // DUPLICATE_KEY
```

Both functions are synchronous and take explicit strings. They perform no file,
network, or process-environment access. Reports have stable codes, deterministic
ordering, source locations, recommendations, and a versioned schema. Invalid API
arguments throw safe `TypeError`s; strings over 1,048,576 UTF-16 code units throw
`RangeError`s, as do record/metadata budget violations. Configuration syntax problems
become diagnostics.

Read the [parser contract](docs/PARSER.md) and [analysis/report contract](docs/REPORT.md)
for all inputs, fields, errors, codes, and recovery behavior. Runnable examples and
local/maintainer/CI scenarios are in the
[examples guide](https://github.com/ghazy001/configpilot/blob/main/examples/README.md).
This is an **ESM-only** package with bundled TypeScript declarations. Use `.mjs`
or `"type": "module"` in JavaScript consumers. CommonJS consumers can use
asynchronous `import("configpilot")`; synchronous `require()` is not part of the
supported contract across Node.js 20+. No separate CommonJS build is shipped.

TypeScript consumers use the same named imports with `module`/`moduleResolution`
set to `NodeNext` and an ESM file (`.mts`, or `.ts` in a `"type": "module"` project).
Bundler resolution is also verified. Types describe source locations, diagnostics,
options and schema-version-1 reports, including unavailable skipped counts:

```ts
import { analyzeConfig, type AnalysisReport } from "configpilot";

const report: AnalysisReport = analyzeConfig({
  template: "PORT=3000",
  environment: "",
});
if (report.comparison === "complete") {
  console.log(report.summary.missingKeys); // number
} else {
  console.log(report.summary.missingKeys); // null
}
```

The shipped declarations require no `@types/node` or TypeScript installation at
runtime. The supported compiler floor is TypeScript 5.0.4 (Bundler resolution requires 5.0).
Development checks exercise 5.0.4 and 7.0.2 against an offline-installed archive with
strict checking and no ambient Node types. Intermediate compiler versions are not
individually certified.

## Privacy and limits

Assignment values and raw invalid lines never appear in ConfigPilot diagnostics,
terminal/JSON reports, or its controlled errors. The `check` command reads only the selected
configuration inputs, keeps no temporary copies, never rewrites them, never executes
their contents or project modules, and makes no network requests. The API returns
names and locations, fixed text, status, and counts.

Names and file labels **are public metadata**: do not put credentials in either.
ConfigPilot is not a secret scanner, value validator, dotenv loader, or deployment
health check. Empty values count as declarations. Interpolation is never resolved;
physical multiline values are unsupported and conservatively quarantined. An
unclosed quote can suppress later declarations. Reads are not atomic snapshots of
concurrently edited files. Review parser errors before trusting differences.

See [SECURITY.md](SECURITY.md) for the privacy boundary and vulnerability-reporting
process. Share synthetic reproductions rather than real configuration files.

## Contribute and follow development

For development, use Node.js **20.19+, 22.13+, or 24+** to run ESLint 10:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run test:coverage
```

The Quality workflow exercises Linux, Windows, and macOS on Node 20/22/24/26, with
a separate Node 20.0.0 runtime job. See the
[testing guide](https://github.com/ghazy001/configpilot/blob/main/docs/TESTING.md)
for commands, coverage interpretation, matrix details, and intentional platform skips.

- [Contributing](https://github.com/ghazy001/configpilot/blob/main/CONTRIBUTING.md): setup, focused changes, safe bug reports, and review expectations.
- [Code of conduct](https://github.com/ghazy001/configpilot/blob/main/CODE_OF_CONDUCT.md): respectful project participation.
- [Changelog](CHANGELOG.md): release history and upcoming changes.
- [Repository safeguards](https://github.com/ghazy001/configpilot/blob/main/docs/CI.md) and [candidate preparation](https://github.com/ghazy001/configpilot/blob/main/docs/RELEASING.md): required CI, dependency updates, and owner review before publication.
- [Progress](https://github.com/ghazy001/configpilot/blob/main/docs/PROGRESS.md) and [project specification](https://github.com/ghazy001/configpilot/blob/main/AGENTS.md): completed work, decisions, and outstanding milestones.
- [Issues](https://github.com/ghazy001/configpilot/issues): reproducible bugs and focused feature proposals; follow the security policy for vulnerabilities.

The [stable-release plan](https://github.com/ghazy001/configpilot/blob/main/docs/STABILITY.md)
tracks remaining validation and approval gates. Use maintained Node releases for
production; compatibility with Node 20 does not extend its upstream security support.

Publication, release tags and external releases require explicit owner approval.
The preparation workflow inspects candidates and never publishes automatically.
