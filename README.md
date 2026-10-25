# ConfigPilot

Explainable environment-configuration diagnostics for developers and CI.

ConfigPilot is being built to compare environment-variable declarations, explain
configuration inconsistencies, and recommend safe actions without reporting values.

**Development status:** Milestone 2 (dotenv parser). The JavaScript API parses a
documented dotenv subset into variable names, source locations, and safe diagnostics.
Help and version commands work. Configuration comparison, CLI `check`, and JSON
reports are **not implemented**. This package is not yet ready for production use
or published to npm by this project.

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
clear message that analysis is not implemented. Unknown commands, extra arguments,
and unsupported flags also fail. Arguments are never repeated in errors.

| Exit code | Current meaning                                             |
| --------- | ----------------------------------------------------------- |
| `0`       | Help or version completed successfully.                     |
| `2`       | Unsupported arguments or a command that is not implemented. |

This is the foundation contract. The analysis exit-code contract will be documented
when `check` is implemented. Output uses plain text with no ANSI colors, including
when `NO_COLOR` is set or output is redirected. Help/version use stdout; errors use
stderr.

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
The ESM package entry point exports `parseDotenv`; CommonJS is not a target.

The CLI entry point handles process I/O; `src/cli.js` resolves arguments independently.
Parsing is pure and independent of filesystem and presentation code. Comparison
will follow the same separation. Only explicitly listed runtime files and parser
documentation, plus npm's mandatory metadata, README, and license, are packaged.
Adding runtime modules requires updating the allowlist and packaging tests.

## Privacy and release safety

The current CLI never reads configuration files, executes their contents, writes
configuration, or makes network requests. The parser only examines text passed to
it and returns names, caller-provided file labels, locations, and fixed diagnostic
text. Names and labels are public metadata; do not encode credentials in them.
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
and [AGENTS.md](AGENTS.md) for the full product specification. Next: Milestone 3,
key-set comparison and explainable configuration diagnostics.

## License

[MIT](LICENSE).
