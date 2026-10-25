# ConfigPilot

Explainable environment-configuration diagnostics for developers and CI.

ConfigPilot is being built to compare environment-variable declarations, explain
configuration inconsistencies, and recommend safe actions without reporting values.

**Development status:** Milestone 1 (repository and tooling foundation). Help and
version commands work. Configuration parsing, comparison, JSON reports, and the
JavaScript analysis API are planned and are **not implemented**. This package is
not ready for production use or published to npm by this project.

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
The ESM package entry point currently exports no API; CommonJS is not a target.

The CLI entry point handles process I/O; `src/cli.js` resolves arguments independently.
Future parsing and analysis will remain separate from filesystem and presentation
code. Only explicitly listed runtime files, plus npm's mandatory metadata, README,
and license, are packaged. Adding runtime modules requires updating the allowlist
and packaging tests.

## Privacy and release safety

The current CLI never reads configuration files, executes their contents, writes
configuration, or makes network requests. No parsing or secret-detection guarantees
are claimed for the planned analyzer. Avoid passing credentials on the command line;
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
and [AGENTS.md](AGENTS.md) for the full product specification. Next: implement and
document a value-free dotenv parser with meaningful syntax and privacy tests.

## License

[MIT](LICENSE).
