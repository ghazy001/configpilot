# ConfigPilot

Explainable environment-configuration diagnostics for developers and CI.

ConfigPilot compares environment-variable declarations, explains configuration
inconsistencies, and recommends safe actions without reporting values.

**Development status:** Milestone 5 complete (testing and quality). Use `configpilot check` or the
JavaScript API to compare a documented dotenv subset, with actionable terminal or
JSON reports that omit values. Quality checks pass on Linux, Windows, and macOS across
the configured Node runtime matrix. The full release-readiness review and npm
publication remain pending. This project has not published to npm yet.

## Try the current CLI

Requires Node.js **20 or newer** and npm. From this checkout:

```sh
npm ci
node bin/configpilot.js --help
node bin/configpilot.js --version
node bin/configpilot.js check --template examples/reference.txt --env examples/environment.txt
```

For a local executable installation, run `npm install --global .` from this checkout,
then `configpilot --help` or `configpilot check`. No registry installation is required. Package-name
availability and ownership have not yet been verified; do not install a registry
package based on this README.

The example uses synthetic values and reports `DATABASE_URL` as missing and
`REDIS_URL` as undocumented. Its **exit code is 1**, indicating findings to review.
The terminal report includes these lines:

```text
WARNING DATABASE_URL [MISSING_KEY]
WARNING REDIS_URL [UNDOCUMENTED_KEY]
Summary: 0 errors, 2 warnings, 0 info.
No files were modified.
```

For your project, run these commands from the directory containing your configuration:

```sh
configpilot check
configpilot check --template .env.example --env .env
configpilot check --json
```

Defaults are `.env.example` and `.env` relative to the working directory. Paths may
contain spaces or Unicode; use shell quoting as needed. Path options also support
`--template=PATH` and `--env=PATH`. Files are read only, limited to 1 MiB each, and
must be regular UTF-8 files. With no arguments the CLI displays help.

| Exit code | Current meaning                                                                  |
| --------- | -------------------------------------------------------------------------------- |
| `0`       | No warnings/errors, or help/version succeeded.                                   |
| `1`       | Analysis contains warnings or errors; review the findings.                       |
| `2`       | Invalid arguments, file access/type/encoding/size error, or operational failure. |

Warnings are potential inconsistencies, not proof that a deployment is broken.
They still make CI checks nonzero for review. Output is deterministic plain text
without ANSI colors, including when `NO_COLOR` is set or output is redirected.
Analysis reports and help/version use stdout; terminal usage/read failures use
stderr. JSON mode emits one parseable object on stdout, including a safe error
envelope for operational failures. See [the CLI contract](docs/CLI.md) for all
options, exit codes, streams, error codes, and file/privacy limits.

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
The dependency-free runtime package targets Node.js 20+. The quality workflow tests
Linux, Windows, and macOS; see [the testing guide](docs/TESTING.md) for the matrix,
platform-specific skips, and links to recorded verification results.

```sh
npm ci
npm run check
npm run test:coverage
npm run pack:dry-run
```

- `npm test`: unit, CLI integration, and isolated package installation tests using
  Node's built-in test runner.
- `npm run test:coverage`: all tests with Node's experimental coverage report.
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

The CLI entry point handles process I/O; `src/cli.js` separates pure argument parsing
from asynchronous command orchestration. A bounded UTF-8 reader and pure terminal/
JSON reporters support the command without adding filesystem access to the API.
Parsing and comparison are pure and independent of filesystem and presentation
code. A shared diagnostic catalog keeps codes, messages, and recommendations
consistent. Only explicitly listed runtime files and API documentation, plus
npm's mandatory metadata, README, and license, are packaged.
Adding runtime modules requires updating the allowlist and packaging tests.

## Privacy and release safety

The CLI reads only the two selected configuration files; it never executes their
contents, writes configuration, loads project modules, or makes network requests.
The parser and analyzer only examine
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
and [AGENTS.md](AGENTS.md) for the full product specification. Next: Milestone 6,
documentation and developer experience.

## License

[MIT](LICENSE).
