# Testing and quality

ConfigPilot uses Node's built-in test runner and synthetic configuration data.
There are no runtime dependencies, build steps, test services, or credentials.

## Run the checks

Use a development runtime supported by ESLint 10: Node.js 20.19+, 22.13+, or 24+.
The installed package continues to target Node.js 20+ independently of lint tooling.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run test:coverage
npm run pack:dry-run
```

`check` runs lint with zero warnings, runtime and independent contract tests, installed TypeScript consumer
verification, and formatting verification. `npm run test:types` runs that consumer
check separately with pinned TypeScript 5.0.4 and 7.0.2. It packs the real checkout, installs
it offline in a temporary project, and compiles positive/negative fixtures from
`type-tests/` with strict checking, exact optional properties, and library checking
enabled. Both NodeNext and Bundler resolution must pass; `@ts-expect-error` checks
reject invalid inputs, value fields, private imports, and unsafe report narrowing.
Emitted ESM is executed, as is CommonJS dynamic import. Fixtures never ship in the
archive. The compiler and its platform packages are development dependencies only.

The minimum Node 20.0.0 job runs runtime tests without this development-tool check.
Declaration verification runs in all twelve development matrix jobs and candidate
preparation via `npm run check`. No compilation/build is needed to use ConfigPilot.

`test:coverage` runs the same tests with Node's experimental coverage instrumentation
and fails below 90% lines or branches in the parser/analyzer (or if their rows are
missing).
Coverage output includes test files and child processes; inspect the individual
`src/` and `bin/` rows when evaluating product coverage. Coverage numbers can vary
with Node/V8 versions and operating-system branches. The core parser and analyzer
target at least 90% line coverage; coverage complements behavioral assertions.

Run a focused test with, for example:

```sh
npm test -- --test-name-pattern="bounded reader"
npm test -- --test-name-pattern="tarball"
```

Use `npm test` rather than invoking `node --test` directly for the complete suite:
the package test uses npm's `npm_execpath` to test the same npm installation.

## What the tests verify

| Area                     | Assertions                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Parser                   | Supported grammar, quotes/escapes, BOM and line endings, duplicate source locations, bounded input, controlled syntax errors, conservative multiline recovery.                                                                                                                                                                                         |
| Analyzer                 | Set differences, unique counts, stable codes/severities, actionable recommendations, deterministic ordering, skipped comparisons, explicit inputs without filesystem or environment dependence.                                                                                                                                                        |
| Generated configurations | 128 reproducible pairs combine whitespace, comments, exports, quotes, duplicates, case-sensitive/prototype-like names, and line endings. Independently recorded declarations determine expected locations and set counts; replacing values leaves reports unchanged.                                                                                   |
| CLI and reporters        | Actual executable, documented help/version/options, 0/1/2 exit contract, JSON/terminal streams, malformed arguments, clean/mismatch/syntax reports, control-character escaping, redirected output and closed pipes.                                                                                                                                    |
| Documentation examples   | README terminal output and public API snippet match actual execution; clean example exits zero; runnable library example works from another directory, equals CLI JSON, and leaves inputs unchanged.                                                                                                                                                   |
| Filesystem               | Default/explicit paths, another working directory, spaces and Unicode, native path separators, permissions, UTF-8 validation, inclusive size limits, symlinks, device/FIFO rejection.                                                                                                                                                                  |
| Fault handling           | Isolated child processes simulate unreadable/malformed package metadata, output I/O errors, descriptor replacement/stat failures, growing files, interrupted/short reads, split UTF-8 bytes, and close failures. Opened descriptors are closed; native error details are redacted.                                                                     |
| Privacy and integrity    | Synthetic tokens, passwords, connection strings, invalid lines, and multiline credentials stay out of reports, inspection output, and exceptions. Configuration bytes remain unchanged. Shell expressions and project modules are not executed.                                                                                                        |
| Distribution             | Exact real-checkout dry-run and archive file lists; a separate staged archive with planted synthetic environment files; offline consumer install from the actual checkout archive; byte-for-byte installed content; public API import; installed CLI and platform executable shim; every relative Markdown link resolves inside the installed package. |

Fault injection patches trusted built-ins only inside disposable child processes;
the package needs no production test hooks. Test-created configuration files and
archives live in temporary directories and are removed after each test. No real
configuration is copied into fixtures. A temporary local cache and disabled registry
are used for package operations; consumer installation runs offline with scripts disabled.

The archive test checks the real checkout's allowlist before creating its archive.
Adding a runtime file requires deliberately updating both `package.json` and the
expected distribution list. A changed list should always receive a privacy review.

## Runtime and platform matrix

[The Quality workflow](../.github/workflows/ci.yml) runs on main pushes, pull
requests, and manual dispatches:

- Linux, Windows, and macOS with Node.js 20.19.0, 22.13.0, 24.x, and 26.x: clean
  dependency installation, lint, tests, formatting, and coverage.
- Linux with Node.js 20.0.0: runtime tests, including packaging/import/CLI checks,
  without installing development tools that require a newer Node version.

Actions are pinned to verified immutable commits, checkout credentials are not
persisted, and permissions are limited to reading repository contents. Jobs have
timeouts and obsolete runs on the same branch are cancelled. This verification
workflow was brought forward from Milestone 7 to support Milestone 5 acceptance.
The final **Quality gate** requires all matrix and minimum-runtime jobs to succeed
and is the stable branch-protection check. See [CI.md](CI.md) for repository
permissions, dependency updates and required-check configuration, and
[RELEASING.md](RELEASING.md) for the separate unpublished candidate workflow.

Release-tool tests use an isolated synthetic Git repository with global Git config,
hooks and signing disabled. They verify private/explicit-public metadata, clean/tracked-file guards, safe
paths, offline packing, commit/hash manifests, no candidate overwrites, unchanged
ignored synthetic environment files, and rejection of stale/failed CI checks.
No test submits an owner approval or publishes a package.

Platform-specific POSIX permission/device tests are explicitly skipped on Windows;
Windows runs the installed `.cmd` shim and native path tests instead. Symlink tests
can skip on Windows when creating a symlink requires privileges. These skips are
reported by the runner. Other unexpected skips or failures need investigation.
Archive executable bits are asserted on POSIX, where they are meaningful; both
platforms must successfully execute their installed npm shim.
The repository's `.gitattributes` keeps text checkouts on LF across platforms,
including the executable shebang. This avoids Windows checkout conversion and npm
shebang normalization changing the installed bytes; byte equality stays mandatory.

The matrix samples the minimum runtime, development-tool boundaries, and current
even-numbered release lines. It does not test every Node patch or OS version.
Use [the progress log](PROGRESS.md) for executed commands, measured coverage, actual
workflow results, and remaining limitations. Planned matrix entries are not evidence
that a platform has passed.

## Stability contract and resource checks

`npm run test:contracts` uses pinned development-only dotenv 18.0.9 and Ajv 8.20.0.
It verifies 99 conventional key/location cases, intentional grammar differences,
quote/backslash mutations, emitted JSON schemas and rejected structural mutations.
It is part of `check`; minimum-runtime tests install runtime dependencies while omitting development tools.
The absence of assignment-value fields is also asserted at runtime and in types.

`npm run test:resources` launches isolated synthetic processes for duplicate/different
key sets, escaped long labels, rejected dense inputs and the source-size blank limit.
Each must stay below 5 MiB JSON and 256 MiB peak RSS. These are regression budgets
on the declared probe environment, not promises about arbitrary host processes.
CI runs them on Linux/Node 24; record local/hosted measurements separately. No real
configuration or production project is copied into these probes.

Both compiler versions test NodeNext/Bundler, strict checking, empty type roots,
negative declarations and emitted execution. TS5 permits some synthetic default
imports; namespace-shape and runtime-export assertions independently establish that
ConfigPilot has no default export. Tests do not weaken that runtime contract.

The malformed-reference mutation corpus examines 5,376 combinations; in 1,728,
the reference recognizes a body fragment as value content rather than a key.
Every such case must keep that fragment out of both parser and analyzer metadata.
These deterministic assertions complement actual CLI regressions and do not claim
complete parser equivalence.

The whitespace-recovery corpus adds 2,835 cases across 21 nonportable whitespace
characters, three quote styles, all physical line endings, valid/malformed headers
and closing-line variations. Both default and fast dotenv parsers recognize 2,268
protected bodies; Node's built-in `util.parseEnv` provides an additional independent
runtime oracle. Runtime-specific counts are not pinned. Each recognized body must
stay out of parser/analyzer metadata and reports must validate against the schema.
The actual executable checks both input roles, terminal/JSON, unchanged source bytes
and exit 1 with skipped comparison. Installed archive imports repeat the regression.

## Private candidate acceptance

After committing changes and running `release:prepare`, use:

```sh
npm run --silent candidate:verify -- /absolute/path/to/candidate
```

The dependency-free maintainer script runs on Node 20+ with Git/npm and needs no
network or development dependencies. It validates the supplied manifest, SHA-256 and
npm SHA-512 integrity, matches shipped files to the claimed Git commit and current
checkout, installs the exact archive offline with scripts disabled, compares every
installed byte and checks the public ESM/CJS dynamic-import API, schema resolution,
platform executable shim, help/version and CLI exits 0/1/2 using synthetic inputs.
It checks privacy and resource regressions; input files remain unchanged. Disposable
consumer/cache files are removed afterward; the supplied archive/manifest are read only.

Success emits one JSON receipt identifying commit, artifact digest, runtime, OS and
architecture. Failures emit a fixed stage name and exit 1 without dumping subprocess
output or archive/configuration contents. Tests reject wrong digests, stale commits,
unsafe paths, changed allowlists, dirty shipped source and rehashed-but-changed archive
bytes before installed code executes. Both preparation and verification compare Git
blobs directly, including when assume-unchanged hides edits from status/diff.
This accepts a reviewed source/archive pair;
it is not authentication of an untrusted sender and does not grant release approval.
TypeScript/lint/contract/coverage checks still run separately. Full OS matrix checks
are broader than this smoke test; record both without treating one as the other.

Coverage enforcement reads structured test:coverage events through a custom reporter,
not Node's version-specific flat/tree terminal tables. It fails when expected core
statistics are missing, malformed, below floor or tests fail. Temporary coverage
statistics contain paths/counts only and are removed after verification.

Use a current compatible npm CLI for advisory audits. During this work npm 10's
legacy quick-audit fallback rejected the compiler-alias dependency graph; the isolated
npm 11.21.1 audit succeeded. A failed audit is not evidence of zero vulnerabilities.
No global npm upgrade is required by the runtime package.
