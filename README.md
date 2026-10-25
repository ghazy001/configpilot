# ConfigPilot

**Explainable environment-configuration diagnostics for developers and CI.**

A new variable was added to `.env.example`, your local `.env` is missing it, and
an old key is still hanging around. ConfigPilot compares the declarations, explains
what needs review, and suggests an action without displaying configuration values.

Use the CLI for local checks and pipelines, or the dependency-free JavaScript API
for your own tooling. It finds missing and undocumented keys, duplicate assignments,
and syntax outside its [documented dotenv subset](docs/PARSER.md).

**Pre-release:** the checkout identifies itself as `0.1.0`, but this project has
not published an npm package or release. npm name ownership is not yet verified.
Use this repository or a locally built archive; registry installation is not yet
documented. Runtime: **Node.js 20+**, ES modules. License: [MIT](LICENSE).

## Try it in one minute

With Git and Node.js 20+ installed:

```sh
git clone https://github.com/ghazy001/configpilot.git
cd configpilot
node bin/configpilot.js check --template examples/reference.txt --env examples/environment.txt
```

No build or dependency installation is needed to run the CLI. The supplied files
contain synthetic values. The command exits **1** because it finds two warnings:

```text
ConfigPilot — Configuration Analysis

WARNING DATABASE_URL [MISSING_KEY]
        template "examples/reference.txt":1
        Template variable has no declaration in the environment input. It may be supplied externally.
        Action: Provide this key locally or through the deployment environment. Verify external provisioning before changing files.

WARNING REDIS_URL [UNDOCUMENTED_KEY]
        environment "examples/environment.txt":2
        Environment variable is not documented in the reference template.
        Action: Document this key in the reference template if intentional, or review whether it is still needed.

Comparison: complete
Summary: 0 errors, 2 warnings, 0 info.
Keys: 2 template, 2 environment; 1 shared, 1 missing, 1 undocumented.
Review the reported configuration issues.
No files were modified.
```

A missing declaration may be provided by your deployment platform. Review the
recommendation before changing files; ConfigPilot does not inspect runtime provisioning.

## Install locally

For an executable available outside the checkout, run this from the cloned repository:

```sh
npm install --global . --ignore-scripts --no-audit --no-fund
configpilot --help
configpilot --version
```

Your npm global executable directory must be on `PATH`. If installation needs
administrator access, use the checkout command with an absolute path instead;
see [installation troubleshooting](docs/TROUBLESHOOTING.md#installation-and-runtime).

For a project's development dependency or library consumer, build an archive in
the checkout with `npm pack --ignore-scripts`. Then, from the consumer project:

```sh
npm install --save-dev "/absolute/path/to/configpilot/configpilot-0.1.0.tgz" --ignore-scripts --no-audit --no-fund
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
Output is plain text without ANSI colors and works with `NO_COLOR` and redirected
streams. See [the CLI reference](docs/CLI.md) for arguments, streams, error codes,
and file handling, or [troubleshooting](docs/TROUBLESHOOTING.md) for a specific failure.

## Use the JavaScript API

Save this as an `.mjs` file in a consumer project with the local package installed,
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
`RangeError`s. Configuration syntax problems become diagnostics.

Read the [parser contract](docs/PARSER.md) and [analysis/report contract](docs/REPORT.md)
for all inputs, fields, errors, codes, and recovery behavior. Runnable examples and
local/maintainer/CI scenarios are in the
[examples guide](https://github.com/ghazy001/configpilot/blob/main/examples/README.md).
This is an ESM package; a CommonJS entry point and TypeScript declarations are not
currently provided.

## Privacy and limits

Assignment values and raw invalid lines never appear in ConfigPilot diagnostics,
terminal/JSON reports, or its controlled errors. The CLI reads only the selected
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
- [Changelog](CHANGELOG.md): implemented, unreleased changes.
- [Progress](https://github.com/ghazy001/configpilot/blob/main/docs/PROGRESS.md) and [project specification](https://github.com/ghazy001/configpilot/blob/main/AGENTS.md): completed work, decisions, and outstanding milestones.
- [Issues](https://github.com/ghazy001/configpilot/issues): reproducible bugs and focused feature proposals; follow the security policy for vulnerabilities.

The package stays `private` until release readiness and explicit owner approval.
Publication, release tags, and external releases remain gated.
