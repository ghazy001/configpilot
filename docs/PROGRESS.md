# ConfigPilot development progress

Last updated: 2026-10-25 (Africa/Tunis).

## Session scope and inspection

Read `AGENTS.md` completely. The initial directory contained only `AGENTS.md`;
there was no Git repository, implementation, package metadata, or test suite.
Started Milestone 1 as explicitly directed by the agent starting instruction.
Discovery remains unfinished and must inform later product decisions.

## Milestones

| Milestone             | Status      | Completed                                                                                                                                                                                                                      | Outstanding work and remaining risks                                                                                                                                    |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Discovery         | In Progress | Product specification identifies personas, problems, and positioning.                                                                                                                                                          | Review five competitors; document a v0.1 boundary, three usage scenarios, real-project evaluation candidates, and assumptions. No real-world validation yet.            |
| 1 — Repository setup  | Complete    | Initialized Git on `main`; added ESM package metadata, CLI entry point, npm scripts, ESLint, Prettier, EditorConfig, ignore rules, MIT license, README, built-in test runner, naming conventions, and Node.js 20+ requirement. | Foundation checks passed; runtime/platform verification passed under Milestone 5.                                                                                       |
| 2 — Parser            | Complete    | Pure public `parseDotenv` API; portable keys/locations, comments, exports, whitespace, quotes/escapes, line endings/BOM, duplicates, safe syntax diagnostics, bounded input, and value-free results.                           | Physical multiline values remain unsupported and are quarantined. Exact syntax and recovery are documented in docs/PARSER.md; full dotenv compatibility is not claimed. |
| 3 — Diagnostics       | Complete    | Pure analyzeConfig API; key-set comparison, shared diagnostic catalog, six stable codes, actionable recommendations, deterministic ordering, versioned report, and summary counts.                                             | Parser errors deliberately skip differences; external runtime provisioning is not inspected. CLI reporting was delivered in Milestone 4.                                |
| 4 — CLI               | Complete    | Working check command, path options, help/version, terminal/JSON reports, strict arguments, exit codes, safe bounded reads, CI-compatible output, and integration tests.                                                       | CLI contract is unchanged. Native Windows/Linux verification passed under Milestone 5.                                                                                  |
| 5 — Testing           | Complete    | 139 tests; 100% local runtime line coverage; seeded invariants, isolated I/O faults, actual-checkout archive/offline installation checks; all 13 hosted runtime/platform jobs passed.                                          | Matrix samples supported runtime lines; Windows skips two POSIX-only tests. Coverage and tests do not replace real-project validation or release readiness.             |
| 6 — Documentation     | In Progress | README quick start and real terminal excerpt; CLI/PARSER/REPORT contracts cover implemented behavior, schema, exit codes, errors, privacy, and limits; safe examples and progress log updated.                                 | Add troubleshooting and contributing/security/changelog/community documents; complete release metadata during readiness work.                                           |
| 7 — CI/CD             | In Progress | Verified least-privilege pinned Quality workflow: Linux/Windows/macOS, runtime matrix, lint/format/tests/coverage, archive/import/installed-CLI checks.                                                                        | Add dependency updates, repository protection/required checks, and approval-gated release setup. No publishing workflow yet.                                            |
| 8 — Release readiness | Not Started | Private package guard, explicit runtime file allowlist, ESM exports/bin, license, and offline consumer installation/import/CLI verification passed.                                                                            | Verify ownership/name availability, TypeScript declarations, compatibility, final release archive and publishing authentication. This project is not release-ready.     |
| 9 — Publication       | Not Started | None.                                                                                                                                                                                                                          | Owner approval, release checklist, npm publication, public-install verification, and GitHub release. No publication, tag, or external release authorized.               |

## Architectural decisions

- Milestones 1–3 established the repository, parser, and pure comparison engine.
  Milestone 4 adds the working CLI, safe file reads, and reporters. Public parser
  and analyzer contracts remain unchanged. Milestone 5 adds quality verification
  without changing runtime behavior or adding dependencies.
- Use Node's built-in test runner and no runtime dependencies. Use maintained
  ESLint 10; its development runtime requirement is Node.js 20.19+, 22.13+, or 24+.
  The shipped runtime still targets Node.js 20+. Pin direct development dependencies
  and commit the npm lockfile for repeatability. ESLint 9 was rejected after npm
  reported its end of support, confirmed by the
  [official support schedule](https://eslint.org/version-support/).
- Separate the executable's process I/O from `src/cli.js`, which now has a pure
  `parseArguments` function and asynchronous command orchestration with injectable
  reads. File reading and terminal/JSON formatting live in separate modules. The ESM entry point exports `parseDotenv`,
  `analyzeConfig`, and frozen `ISSUE_CODES`. Parsing and comparison have no I/O or
  runtime dependencies. One small diagnostic catalog holds both explanations and
  recommendations to prevent parser/analyzer drift.
- Use an exact runtime file allowlist instead of publishing entire directories.
  Every new runtime module needs a corresponding allowlist and package-test update.
  This reduces accidental packaging risk at a small maintenance cost.
- Set `private: true` to block accidental publication until an approved release
  readiness change. Do not invent owner identity, repository URLs, or npm ownership.
- Current CLI exit codes: 0 for clean analysis or help/version, 1 for analysis
  warnings/errors, and 2 for argument, file, or operational failures. No arguments
  displays help. Reject extra/mixed/duplicate options. JSON errors use a separate
  safe envelope; analysis reports keep schema version 1.
- Use plain output with no colors. Never repeat arbitrary CLI arguments in errors.
  Ignore environment files in Git and formatting. Preserve `AGENTS.md` verbatim
  and exclude it from formatting to avoid rewriting the owner's specification.

## Milestone 1 verification (historical)

Initial environment: Node.js v20.20.0, npm 10.8.2, Git 2.40.1, macOS.

- Git initialization succeeded after the sandbox required permission to write `.git`.
- The first dependency download could not resolve the npm registry in the sandbox;
  retried with explicitly approved network access and succeeded. npm reported zero
  vulnerabilities for the final dependency graph (80 audited packages).
- `npm ci --ignore-scripts --offline --no-audit --no-fund --cache /private/tmp/configpilot-npm-cache`: passed, reproducing installation from the lockfile.
- `npm run check`: passed. ESLint: zero errors/warnings. `npm test`: 8 tests passed, 0 failures/skips. Prettier: all matched files formatted.
- The first lint run caught missing explicit `URL` imports; fixed them and reran the complete check successfully.
- `npm run pack:dry-run -- --json`: passed after permission to access npm's default cache/log directory. Exactly six intended files: LICENSE, README.md, package.json, bin/configpilot.js, src/cli.js, src/index.js. CLI mode is executable. No environment files or development assets included.
- Package integration test: actual tarball installed offline in a clean temporary consumer; exact installed file list, package import, CLI help/version, and executable mapping passed. Planted synthetic environment files were excluded.
- CLI integration tests: current exit codes and stream routing, safe argument errors, no ANSI escapes, Unicode/spaced working paths, credential non-disclosure, and unchanged configuration files passed.
- `git check-ignore`: root/nested environment files, node_modules, and .npmrc are ignored. `git diff --check`: passed.
- Verification is local to macOS and Node.js 20.20.0. No claims are made for untested Node versions or Windows/Linux. No parser/analyzer coverage exists yet.
- No configuration contents were transmitted, and no package, tag, or external release was published.

The tests use synthetic credentials only. The package test builds an actual archive
from an isolated staging directory containing planted environment files, verifies
its exact file list, installs it into an offline temporary consumer, checks the
installed contents and CLI executable mapping, and imports the ESM package. This
tests packaging without inspecting or copying real environment files.

## Repository push session — 2026-10-25

- Owner requested pushing Milestone 1 to
  [ghazy001/configpilot](https://github.com/ghazy001/configpilot), with Milestone 2
  deferred to a later session.
- Inspected GitHub's existing `main`: a single initial commit containing LICENSE.
  Based the local branch on that commit while retaining all working files, and
  preserved the owner's existing MIT copyright notice.
- Configured `origin` and added verified repository, homepage, and issue links to
  package metadata and README. npm ownership remains unverified.
- Pre-push `npm run check` passed: lint, all 8 tests, and formatting. The package
  integration test reverified the archive and offline consumer installation.
- Reviewed all 16 candidate files: no environment files, build archives, symlinks,
  or known credential patterns found. Dependency URLs use the public npm registry.
- Delivery target: a normal commit and push to `origin/main` preserving the initial
  license commit. No force push, tags, npm publication, or external release.
- Milestone 2 was deferred for that push session, per the owner's request.

## Milestone 2 session — 2026-10-25

Status: **Complete**. Owner authorized implementation and a normal push to
`origin/main`. The work resumed after an interruption without discarding changes.

Completed:

- Added `src/parser/dotenv-parser.js` and exposed `parseDotenv` through `src/index.js`.
- Return only accepted keys, caller-provided file labels, one-based line locations,
  and structured issues. Duplicate occurrences reference the first valid declaration.
- Support comments, spaces/tabs, optional export, empty/unquoted/single-quoted/
  double-quoted/backtick values, escapes, embedded equals/hash characters, BOM,
  LF/CRLF/CR line endings, and case-sensitive portable keys.
- Return `INVALID_DECLARATION`, `UNSUPPORTED_MULTILINE`, and `DUPLICATE_KEY` with
  fixed messages/recommendations and deterministic source ordering.
- Skip unsupported or unclosed quoted blocks, including malformed assignments
  and chained unmatched quotes, so credential body lines cannot become reported
  keys. Never decode, interpolate, execute, or retain values in output.
- Validate source/options without coercing source arguments; reject input beyond
  1,048,576 UTF-16 code units using a fixed safe error.
- Add meaningful unit and child-process security tests. Update the package test
  to install/import/execute the public parser from an actual offline tarball.
- Add docs/PARSER.md and update README, CLI development status, and the exact
  package allowlist. The parser contract is shipped alongside the runtime.

Decisions and limitations:

- Use a small, explicit scanner and `Map` for duplicate tracking, keeping zero
  runtime dependencies and treating prototype-like names as ordinary keys.
- Detect quoted boundaries without retaining or decoding values. Escapes affect
  delimiter recognition in all three quote styles; this is a documented subset,
  not a claim of complete compatibility with Node.js or the dotenv package.
- Quarantine is conservative: an unclosed quote suppresses the rest of the input.
  Fix or review issues before comparing declaration sets. Physical multiline
  values are not accepted; literal escaped line breaks remain opaque value text.
- Input-size bounds use JavaScript string length, not UTF-8 bytes. Metadata labels
  and variable names are public; this is not a secret scanner or value validator.
- No comparison API, analysis summary, filesystem CLI check, new dependency,
  publication, release tag, or external release is part of this milestone.

Verification (macOS, Node.js 20.20.0, npm 10.8.2):

- `node --test test/unit/dotenv-parser.test.js test/integration/parser.test.js`:
  52 parser-focused tests passed, zero failures.
- `npm run check`: passed; all **60 tests** passed with no failures or skips,
  ESLint had zero errors/warnings, and Prettier checks passed.
- `npm test -- --experimental-test-coverage`: all 60 tests passed; the parser
  measured **100% line, branch, and function coverage**. Coverage does not establish
  compatibility beyond the documented grammar or replace real-project validation.
- `npm run pack:dry-run -- --json --cache /private/tmp/configpilot-npm-cache`:
  passed; exactly eight files (LICENSE, README.md, package.json, executable CLI,
  src/index.js, src/cli.js, parser module, docs/PARSER.md). No environment/test files.
- Actual offline tarball installation passed with public API invocation, duplicate
  locations, value non-disclosure, exact installed contents, and CLI help/version.
  Planted environment files under src/parser were also excluded.
- Child-process checks passed: no stdout/stderr secret leakage, environment
  mutation, shell/JavaScript execution, or configuration-file modification.
- `git diff --check`: passed. Other platforms and Node.js versions remain unverified.

## Milestone 3 session — 2026-10-25

Status: **Complete**. Inspected the clean repository at Milestone 2 commit
`98f59ba`. Continued the established implementation, verification, commit, and
normal push workflow for `origin/main`.

Completed:

- Added pure `analyzeConfig({ template, environment, templateFile?, environmentFile? })`.
  It parses explicit text, compares distinct accepted names, and returns only safe
  issues, status, and counts. No filesystem, runtime environment, or project-code access.
- Detect missing/undocumented keys at their first valid occurrence. Preserve all
  duplicate and syntax findings with a `source` role even if file labels coincide.
- Centralized stable codes, severities, messages, and recommendations in
  src/diagnostics/issue-codes.js; exposed frozen `ISSUE_CODES` to consumers.
  Existing parser result shape, codes, severity, and text are preserved.
- Define `schemaVersion: 1`, complete/skipped comparison status, deterministic
  severity/source/line ordering, and summary counts of issues and unique keys.
- Added docs/REPORT.md, comparison examples in README, and parser documentation
  links. Updated CLI status/error wording without implementing Milestone 4 commands.
- Extended the exact package allowlist and offline consumer test for the analyzer,
  diagnostic catalog, report contract, and all three public exports.

Decisions and remaining limitations:

- Missing and undocumented names are warnings, not assertions of broken deployment.
  Missing keys may be externally provided; recommendations explicitly say to verify
  external provisioning before changing files. No process.env fallback is implicit.
- If either parser reports an error, suppress all cross-input differences. Add one
  informational `COMPARISON_SKIPPED` finding and set shared/missing/undocumented
  counts to null. Accepted per-input key counts remain partial and are documented.
  This avoids false missing/undocumented findings from conservative parser recovery.
- Duplicate warnings do not block comparisons or inflate key counts. Empty values
  count as declarations, and value changes alone never create findings.
- Keep codes, explanations, and recommendations together in one small shared module
  rather than separate registries for six diagnostics. The public report contract
  is explicit and versioned; parser behavior remains unchanged.
- Physical multiline values, runtime variable resolution, severity customization,
  policy files, filesystem CLI checks, and terminal/JSON CLI reporters remain outside
  this milestone. No new dependency, npm publication, release tag, or external release.

Verification (macOS, Node.js 20.20.0, npm 10.8.2):

- `node --test test/unit/config-analyzer.test.js test/integration/analyzer.test.js`:
  all **27 analyzer-focused tests passed**.
- `npm run check`: passed; **87 tests**, zero failures/skips, clean ESLint with
  zero warnings, and clean Prettier checks. All existing parser/CLI tests passed.
- `npm test -- --experimental-test-coverage`: 87 tests passed. Analyzer: **100% lines,
  94.74% branches, 100% functions**. Parser and shared diagnostic catalog: **100% lines,
  branches, and functions**. Coverage does not replace supported-platform validation.
- `npm run pack:dry-run -- --json --cache /private/tmp/configpilot-npm-cache`:
  passed; exactly **11 intended files**. No environment/test files or unwanted assets.
- Actual archive installed into an offline clean consumer; public analyzeConfig,
  parseDotenv, ISSUE_CODES, report counts/codes, value non-disclosure, and CLI
  help/version passed. Planted environment files in both new source directories
  were excluded; the executable retained its executable mode.
- Child-process tests verified safe success, syntax-error, and exception output;
  no value/raw-line/multiline-body disclosure, input execution, environment changes,
  or source-file writes. Externally set process.env did not change explicit results.
- Executed the realistic DATABASE_URL/PORT/REDIS_URL mismatch through the public
  API: one missing warning, one undocumented warning, one shared key, no errors.
  Asserted the complete documented JSON report equals actual output.
- `git diff --check`: passed. Other operating systems and Node versions remain
  unverified until the supported-platform CI milestone.

## Milestone 4 session — 2026-10-25

Status: **Complete**. Started from clean Milestone 3 commit `1da0060` and followed
this project's established verify/commit/normal-push workflow for `origin/main`.

Completed:

- Implemented `configpilot check`, default .env.example/.env inputs, explicit
  --template/--env paths in split or equals forms, --json, root/check help, and
  standalone version. Validate all arguments before reading configuration.
- Split pure argument parsing from asynchronous orchestration. Added separate
  terminal/JSON reporters and a regular-file UTF-8 reader; no runtime dependencies.
  Public parseDotenv/analyzeConfig/ISSUE_CODES exports and report schema are unchanged.
- Define exit 0 for clean reports/help/version, 1 for review findings (warnings or
  errors), and 2 for usage/read/operational errors. Warning severity stays advisory;
  nonzero status is a CI review signal, not proof of a broken deployment.
- Keep analysis on stdout; terminal operational failures go to stderr. JSON mode
  emits exactly one stdout object for analysis or a safe operational-error envelope.
  Errors never echo native messages, paths, arbitrary arguments, or source values.
- Restrict reads to selected regular files with checks before/after opening, use
  read-only/nonblocking flags where available, enforce 1 MiB per file before and
  during reads, reject malformed UTF-8, and close descriptors on all read paths.
- Follow symlinks to regular files; reject directory/device/FIFO selections. Quote
  and escape terminal controls, C1 controls, bidi/format characters, and line
  separators in labels while preserving exact JSON.parse data.
- Handle closed output pipes without uncaught stack traces. Keep plain text output
  consistent for NO_COLOR, non-TTY, and redirected streams.
- Added docs/CLI.md, updated README/API links and the package allowlist, and added
  examples/reference.txt and examples/environment.txt using synthetic values only.
- Updated offline package tests to execute the installed check command and verify
  clean/mismatch JSON results. The POSIX executable shim is also executed directly.

Decisions and limitations:

- JSON operational failures are distinct from analysis issues: { schemaVersion: 1,
  error: { code, source?, message, recommendation } }. They exit 2 and include no
  partial report. The six analysis ISSUE_CODES and their semantics remain unchanged.
- CLI file size is bounded in UTF-8 bytes, whereas the pure parser retains its
  UTF-16 code-unit limit. This is intentionally stricter for multibyte input.
- Reads do not provide atomic snapshots of concurrently edited files. Operating
  system permissions/I/O behavior still apply; use stable CI inputs.
- File paths are metadata in successful reports. Operational errors identify only
  the input role to avoid accidentally reflecting credentials passed as arguments.
- No short aliases, stdin loading, -- terminator, policy/config-code loading,
  automatic rewriting, severity overrides, runtime variable expansion, publication,
  tag, or external release is introduced. These choices are documented explicitly.

Verification (macOS, Node.js 20.20.0, npm 10.8.2):

- Focused CLI/argument/reporter tests: **48 passed**, zero failures/skips.
- `npm run check`: **128 tests passed**, zero failures/skips; ESLint and Prettier
  checks passed. Existing parser/analyzer privacy and compatibility tests passed.
- `npm test -- --experimental-test-coverage`: all 128 tests passed. Parser,
  analyzer, command logic, diagnostics, and reporters measured **100% line/branch/
  function coverage**. Reader: **100% lines/functions, 93.55% branches**. Executable:
  **83.33% lines**; package-metadata failure fallback remains unexercised. Overall
  coverage is not a substitute for supported-platform verification.
- `npm run pack:dry-run -- --json --cache /private/tmp/configpilot-npm-cache`:
  passed; exactly **15 intended files**, executable CLI, no real environment files,
  fixtures, examples, tests, or unrelated assets. The offline consumer test verified
  the installed public API and working CLI with clean/mismatch exit codes.
- Actual integration checks passed for default and explicit paths from another
  working directory, spaces/Unicode, equals signs, leading-dash names, native path
  joining, Windows-style option preservation, UTF-8 BOM, and CRLF source locations.
- Confirmed exit 2 with safe output for missing files, permissions, directories,
  symlink-to-directory, FIFO/device, invalid UTF-8, and oversized inputs; exactly
  1 MiB succeeds. Regular-file symlinks work. Closed-pipe behavior passed.
- Confirmed values never appear in clean/warning/syntax-error/JSON output, source
  files stay byte-for-byte unchanged, and shell expressions/project modules are not
  executed. Terminal control escaping and JSON round-trip tests passed.
- Ran the safe examples through the actual CLI: DATABASE_URL missing, REDIS_URL
  undocumented, PORT shared, 0 errors/2 warnings, expected exit **1**.
- `git diff --check`: passed. Linux/Windows and other supported Node versions are
  not claimed as verified; native platform execution remains outstanding.

## Milestone 5 session — 2026-10-25

Status: **Complete**. Inspected the full specification, source, tests, package
contents, runtime inventory, and clean Milestone 4 commit `0412d8e` before changes.

Completed:

- Audited existing parser, analyzer, recommendations, reporters, argument handling,
  CLI integration, privacy, immutability, code-execution prevention, and input limits.
- Added seeded generated tests for 128 configuration pairs. Independently recorded
  declarations verify source locations, duplicate relationships, distinct key counts,
  differences, ordering, repeatability, and invariance when only values change.
- Added isolated child-process fault tests for unreadable/malformed executable
  metadata, output I/O failures, open/descriptor-stat/read/close failures, descriptor
  replacement by a device, growth during reads, and partial reads splitting UTF-8.
  Assert safe errors and descriptor cleanup without production testing hooks.
- Strengthened packaging: inspect the actual checkout's dry-run list before packing;
  independently check the staged planted-secret archive; install the actual checkout
  archive offline; compare every installed byte to source; execute public imports
  and the installed POSIX/Windows shim from a consumer directory with spaces/Unicode.
- Added `test:coverage` and docs/TESTING.md with reproducible commands, coverage
  interpretation, behavior/security assertions, matrix coverage, and explicit skips.
- Added the verification-only Quality workflow: Linux/Windows/macOS with Node
  20.19.0, 22.13.0, 24.x, and 26.x, plus Linux minimum-runtime Node 20.0.0.
  Verified official action tags before pinning immutable commits; read-only permissions,
  no persisted checkout credentials, no secrets, bounded jobs, no publishing.

Decisions and remaining work:

- Brought forward only verification automation from Milestone 7 because Milestone 5
  requires supported-platform evidence. Release automation, branch protection,
  dependency updates, and owner approval before publication remain later work.
- Keep the Node 20+ runtime contract. Development tools have a higher minimum;
  minimum-runtime CI runs dependency-free tests rather than incompatible lint tooling.
- No production/API/schema/exit-code changes, new dependencies, release tags,
  publication, or external release. Native platform checks passed as recorded below.
- Matrix samples release lines and hosted OS images rather than every patch/OS.
  No real-project compatibility or full dotenv support is implied by coverage.

Verification (local macOS and actual GitHub-hosted runners):

- `npm run check` on Node **20.19.0**, **20.20.0**, and **22.22.1**: **139 passed**,
  zero failures/skips per runtime, clean ESLint and Prettier.
- `npm run test:coverage` on Node 20.20.0: **139 passed**. Every runtime module
  measured **100% lines/functions**; parser/analyzer, command logic, diagnostic
  catalog, reporters, and executable measured **100% branches**. Reader branches:
  **96.77%**; the platform-specific nonblocking-flag fallback remains uncovered locally.
- Package tests verified exactly **15 intended archive files**, no synthetic
  environment files/unintended assets, offline API/CLI use, and installed byte equality.
- Coverage figures are from executed instrumentation, not proof of every platform.
- Initial hosted run `40220194142`: Linux minimum-runtime and all Linux/macOS
  matrix jobs passed. Windows exposed an invalid POSIX-mode assertion in the
  package test: Windows archives do not preserve Unix executable bits. Restricted
  that assertion to POSIX and retained mandatory installed-shim execution on every
  platform. The final successful run below verifies that change.
- Follow-up run `40220713276`: Linux/macOS and minimum runtime still passed;
  Windows progressed to a byte-integrity assertion. Git's automatic CRLF checkout
  converted the shebang, which npm normalizes to LF when installing. Added
  `.gitattributes` to keep repository text on LF across platforms; retained strict
  installed-byte equality rather than normalizing away differences in the test.

- Final quality run for code commit `f116f5c`: [all 13 jobs passed](https://github.com/ghazy001/configpilot/actions/runs/40221334220).
  Linux/Windows/macOS each passed on Node **20.19.0**, **22.13.0**, **24.x**, and
  **26.x**, including npm ci, lint, tests, formatting, and instrumented coverage.
  Linux also passed the complete runtime suite on **Node 20.0.0** without dev tools.
- Inspected the successful Windows 20.19.0 log: **137 passed, 0 failed, 2 explicit
  POSIX-only skips** (permissions and FIFO/device tests), both normal and coverage
  runs. Regular-file/directory symlinks, native paths, spaces/Unicode, strict package
  byte equality, and the installed `.cmd` shim all passed. POSIX jobs run the skipped
  permission/device tests; local macOS ran all **139** without skips.
- Windows Node 20.19.0 instrumentation measured **100% lines, branches, and
  functions for every runtime module**, including the reader's platform fallback.
- No runtime behavior changes were needed. The two observed Windows packaging-test
  failures were fixed and the full matrix was rerun successfully, preserving strict
  installation and privacy assertions.
- `git diff --check`: passed. No npm package, tag, or external release was created.

## Next task

Milestone 6: troubleshooting, contribution/security/changelog/community documentation
and a coherent first-time developer experience. Discovery and real-project evaluation
remain open; the remaining CI/release and publishing safeguards retain their milestones.
