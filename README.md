# ConfigPilot

Explainable environment-configuration diagnostics for developers and CI.

ConfigPilot compares environment-variable declarations, explains configuration
inconsistencies, and recommends safe actions without reporting values.

**Development status:** Milestone 3 (comparison and diagnostics). The JavaScript
API parses and compares a documented dotenv subset, with value-free structured
reports. Help and version commands work. CLI `check` and terminal/JSON CLI reports
are **not implemented**. This package is not yet ready for production use or
published to npm by this project.

## Try the current CLI

Requires Node.js **20 or newer** and npm. From this checkout:

```sh
npm ci
node bin/configpilot.js --help
node bin/configpilot.js --version
```

For a local executable installation, run `npm install --global .` from this checkout,
then `configpilot --help`. No registry installation is required. Package-name
availability and ownership have not yet been verified; do not install a registry
package based on this README.

With no arguments, the CLI displays help. `configpilot check` currently returns a
clear message directing you to the JavaScript analysis API. Unknown commands, extra arguments,
and unsupported flags also fail. Arguments are never repeated in errors.

| Exit code | Current meaning                                             |
| --------- | ----------------------------------------------------------- |
| `0`       | Help or version completed successfully.                     |
| `2`       | Unsupported arguments or a command that is not implemented. |

This is the foundation contract. The analysis exit-code contract will be documented
when `check` is implemented. Output uses plain text with no ANSI colors, including
when `NO_COLOR` is set or output is redirected. Help/version use stdout; errors use
stderr.

## Compare configurations

From this checkout or a locally installed package:

```js
import { analyzeConfig } from "configpilot";

const report = analyzeConfig({
  template: "DATABASE_URL=example\nPORT=3000",
  environment: "PORT=4000\nREDIS_URL=example",
});

console.log(report.comparison); // complete
console.log(report.issues.map(({ code, key }) => ({ code, key })));
// [
//   { code: "MISSING_KEY", key: "DATABASE_URL" },
//   { code: "UNDOCUMENTED_KEY", key: "REDIS_URL" }
// ]
console.log(report.summary.warnings); // 2
```

Missing and undocumented keys are warnings: a missing local declaration may be
provided externally. Duplicate and syntax findings from both inputs are included.
If either input has parser errors, comparison is explicitly skipped to avoid
misleading differences from partial key sets. Review `report.comparison` and
`report.summary.errors`, then resolve input issues before relying on differences.

Reports have a versioned schema and deterministic issue ordering. Use
`JSON.stringify(report)` for machine-readable output, or the frozen `ISSUE_CODES`
export to identify findings. See [the report contract](docs/REPORT.md) for inputs,
source roles, all six codes, severity rules, summary counts, and skipped comparisons.

## Parse configuration text

From this checkout or a locally installed package:

```js
import { parseDotenv } from "configpilot";

const result = parseDotenv("PORT=3000\nPORT=4000", { file: ".env" });
console.log(result.declarations);
// [
//   { key: "PORT", location: { file: ".env", line: 1 } },
//   { key: "PORT", location: { file: ".env", line: 2 } }
// ]
console.log(result.issues[0].code); // DUPLICATE_KEY
```

The parser supports portable variable names, comments, optional `export` prefixes,
spaces/tabs, empty and quoted values, escapes, embedded equals signs, and Windows
or Unix line endings. It reports duplicates, invalid declarations, and unsupported
multiline values. Returned objects never contain assignment values or raw source.

This is a presence-only parser: empty values count as declarations, references are
not expanded, and input is never executed. Full dotenv compatibility is not claimed.
Multiline quoted bodies are skipped to protect credentials; unclosed quotes suppress
the remaining input. Review issues before using declarations. Inputs above 1,048,576
UTF-16 code units are rejected with a safe `RangeError`.

See [the parser contract](docs/PARSER.md) for the exact grammar, result schema,
diagnostic codes, recovery behavior, and input errors.

## Development

Use Node.js 20.19+, 22.13+, or 24+ for development, matching the
[ESLint 10 requirements](https://eslint.org/docs/latest/use/getting-started#prerequisites).
The dependency-free runtime package targets Node.js 20+; compatibility beyond the
locally tested version remains to be verified in CI.

```sh
npm ci
npm run check
npm run pack:dry-run
```

- `npm test`: unit, CLI integration, and isolated package installation tests using
  Node's built-in test runner.
- `npm run lint`: ESLint with zero warnings allowed.
- `npm run format`: apply Prettier formatting.
- `npm run format:check`: verify formatting without changes.
- `npm run check`: lint, tests, and formatting checks.

There are no runtime dependencies or build steps. Tests execute the CLI in separate
processes and verify an actual tarball in a temporary consumer project without
network access. ESLint and Prettier are development dependencies only. Source uses
ES modules, named exports, kebab-case filenames, and `*.test.js` test filenames.
The ESM package entry point exports `parseDotenv`, `analyzeConfig`, and
`ISSUE_CODES`; CommonJS is not a target.

The CLI entry point handles process I/O; `src/cli.js` resolves arguments independently.
Parsing and comparison are pure and independent of filesystem and presentation
code. A shared diagnostic catalog keeps codes, messages, and recommendations
consistent. Only explicitly listed runtime files and API documentation, plus
npm's mandatory metadata, README, and license, are packaged.
Adding runtime modules requires updating the allowlist and packaging tests.

## Privacy and release safety

The current CLI never reads configuration files, executes their contents, writes
configuration, or makes network requests. The parser and analyzer only examine
explicit text inputs and return names, caller-provided file labels, locations,
fixed diagnostic text, status, and counts. They never inspect `process.env` or
execute project code. Names and labels are public metadata; do not encode credentials in them.
ConfigPilot is not a secret scanner. Avoid passing credentials on the command line;
your shell and operating system may retain arguments independently of ConfigPilot.

Environment files are ignored by Git and formatting. Do not commit real credentials,
including in fixtures, documentation, or JavaScript source. Packaging tests plant
synthetic environment files to verify that they are excluded from the tarball.

The package is marked `private` to block accidental publication. Publishing, release
tags, and external releases require explicit owner approval and the release-readiness
milestone. The source repository is
[ghazy001/configpilot](https://github.com/ghazy001/configpilot). npm ownership is
not yet verified.

See [the progress log](docs/PROGRESS.md) for outstanding milestones and verification,
and [AGENTS.md](AGENTS.md) for the full product specification. Next: Milestone 4,
the working `configpilot check` command and CLI reports.

## License

[MIT](LICENSE).
