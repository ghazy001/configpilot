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

`check` runs lint with zero warnings, all tests, and formatting verification.
`test:coverage` runs the same tests with Node's experimental coverage instrumentation.
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
hooks and signing disabled. They verify private/clean/tracked-file guards, safe
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
