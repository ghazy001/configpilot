# Contributing to ConfigPilot

ConfigPilot is an open-source JavaScript CLI and library for explainable,
value-free environment diagnostics. Bug reports, synthetic compatibility examples,
documentation improvements, and focused code changes are welcome.

Please follow the [code of conduct](CODE_OF_CONDUCT.md). Report potential
vulnerabilities using [SECURITY.md](SECURITY.md), rather than a public bug report.

## Set up the checkout

Fork [ghazy001/configpilot](https://github.com/ghazy001/configpilot), then clone
your fork. For a read-only checkout, the upstream URL works directly:

```sh
git clone https://github.com/ghazy001/configpilot.git
cd configpilot
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

Use Node.js 20.19+, 22.13+, or 24+ for development. The shipped runtime targets
Node.js 20+; newer development-tool requirements must not silently raise that
contract. There is no build step, backend, or account requirement for running the tool.

```sh
node bin/configpilot.js --help
node bin/configpilot.js check --template examples/reference.txt --env examples/environment.txt
node examples/analyze.mjs
```

The CLI mismatch example exits 1 by design; the library example prints a report
and exits 0. Neither changes the example inputs. Follow [examples/README.md](examples/README.md)
and [docs/TESTING.md](docs/TESTING.md) for more scenarios and focused checks.

## Choose a useful change

Read [AGENTS.md](AGENTS.md), the relevant API/CLI contract, and
[docs/PROGRESS.md](docs/PROGRESS.md) before implementation. The progress document
records current completion; the specification's original checkboxes are the roadmap.
Keep changes within the active milestone. Discuss broad behavior changes, new
dependencies, or scope changes in an issue before investing in a large implementation.

Preserve the public exports, report schema, six diagnostic codes, severity meaning,
and CLI exit contract unless a reviewed compatibility decision explicitly changes
them. Before v1.0, breaking changes still require documentation and owner approval.
Do not implement an automatic rewrite, executable project configuration, network
service, or runtime environment expansion as a convenience feature.

## Architecture and conventions

| Location                        | Responsibility                                                            |
| ------------------------------- | ------------------------------------------------------------------------- |
| `src/parser/`                   | Pure recognition of declarations, source locations, and syntax findings.  |
| `src/analyzer/`                 | Pure key-set comparison and report summaries.                             |
| `src/diagnostics/`              | Shared stable codes, fixed explanations, and recommendations.             |
| `src/reporters/`                | Terminal and JSON presentation.                                           |
| `src/cli.js`                    | Argument parsing and command orchestration.                               |
| `src/utils/read-config-file.js` | Bounded, read-only regular-file UTF-8 input.                              |
| `bin/configpilot.js`            | Executable entry point and process I/O.                                   |
| `test/`                         | Built-in Node test runner unit, integration, privacy, and archive checks. |

Use ES modules, named exports, kebab-case filenames, explicit inputs/outputs, and
small focused functions. Keep runtime dependencies minimal; currently there are
none. Prettier handles formatting and ESLint allows zero warnings. `.gitattributes`
keeps text on LF, including the executable shebang, across operating systems.

Values may exist temporarily while parsing but must never enter returned objects,
messages, exception causes, snapshots, logs, or debugging output. Use fixed diagnostic
text and retain names/locations only. Names and file labels are public metadata;
do not use sensitive data for either. Avoid running project code during analysis.

## Verify your change

Add meaningful tests for new behavior or regressions, including malformed input
and privacy assertions when relevant. Prefer behavioral assertions over tests that
repeat implementation details. Use only synthetic data; never copy a real `.env`,
credential, connection string, or production incident log into the repository.

```sh
npm run check
npm run test:coverage
npm run pack:dry-run
git diff --check
```

Review the actual diff and archive file list. Adding a runtime module or shipped
document requires updating both `package.json`'s exact `files` allowlist and the
package integration test. Preserve executable behavior on POSIX and Windows.
Tests pack the actual checkout, install it offline, and verify public imports,
installed bytes, and executable shims. CI covers the supported matrix; platform
skips must be explicit and justified. Record only checks you actually executed.

Update the relevant contract, examples, [CHANGELOG.md](CHANGELOG.md)'s Unreleased
section, and progress document when behavior changes. Run `npm run format` to apply
formatting if needed, then inspect its diff. Do not rewrite the owner's specification
to make an implementation appear compliant.

## Submit a pull request or issue

Create a focused branch in your fork, commit the change, and open a pull request
against upstream `main`. Explain the concrete problem, resulting behavior, relevant
tradeoffs, checks executed, and any remaining limitations. Include synthetic before/
after examples when they clarify the change. Maintainers review scope, compatibility,
privacy, and verification; passing CI is necessary evidence, not automatic acceptance.

For a non-security bug, include:

- ConfigPilot version or commit, Node/npm versions, operating system, and shell.
- The command or public API call and expected versus actual behavior/exit code.
- A minimal synthetic input reproducing the issue, with sanitized key names and paths.
- Safe output only, reviewed before posting. Do not attach environment files or dump `process.env`.

Feature proposals should explain the developer problem and a realistic workflow.
Do not claim competitor or runtime compatibility without reproducible evidence.

## Release boundary

The `0.1.0` metadata is unreleased and the package remains `private`. Do not run
`npm publish`, remove the private guard, create release tags, or create external
releases without explicit repository-owner approval. Package-name ownership,
TypeScript declarations, final archive review, and publishing authentication remain
release-readiness work. No contribution requires production credentials or npm tokens.
