# ConfigPilot development progress

Last updated: 2026-10-27 (Africa/Tunis).

## Current release preparation — v1.2.0

Status: **In Progress — owner authorized push, tag and publication**.
The new discovery/init workflow, premium terminal layout, APIs and documentation
are staged for an additive minor release. See [the release plan](RELEASE_PLAN_v1.2.0.md).
The published registry version remains 1.1.1 until verification and publication finish.

Executed locally for the versioned source: `npm run check` passed 235 runtime tests,
seven contract tests, installed TypeScript 5.0.4/7.0.2 consumers, lint and formatting.
Runtime dependency audit returned zero vulnerabilities. Resource checks passed all
five isolated budgets. Coverage reran all 235 tests successfully (98.79% aggregate
lines; parser/analyzer each 100% lines and branches). `npm pack --dry-run` succeeded; archive inspection/hosted
OS tests and final exact-main publication checks remain gates. Human trials remain
**Pending — Requires Human Participation**.

## v1.1.1 documentation release — Complete

Owner approved the documentation-only patch on 2026-10-26. PR #12 merged as
`cf6b1784e030ac28e6a455a178f7d400aa098327`; protected Quality gates passed on PR and
exact main, including the full Windows/Linux/macOS/Node matrix. Local quality
checks passed 172 tests, seven contract tests, installed TypeScript consumers,
lint and formatting. Runtime source is byte-identical to v1.1.0.

Prepared and verified the exact 21-file archive, including corrected README commands.
The first browser publishing challenge failed (npm auth completion returned 404);
confirmed v1.1.1 was unpublished before retrying the same verified archive with a
fresh owner-approved browser challenge. npm accepted publication, then propagated
the version and latest tag. Registry bytes matched the reviewed archive and fresh
unauthenticated ordinary local/global installs, API/TypeScript and CLI checks passed.
Registry README metadata independently confirms the latest-version installation
commands and absence of stale configpilot@1.0.0 commands.

Created immutable v1.1.1 tag and GitHub release after verification. Exact identities
and CI evidence are in [the receipt](releases/1.1.1.json). No future publication is
authorized by this record. Human trials and manual font-specific checks remain open.

## Historical published release — v1.1.1

Status: **Complete — v1.1.1 published and verified**. npm latest points to 1.1.1.
Registry bytes, fresh installation and hosted compatibility checks passed; see
[the release receipt](releases/1.1.1.json). Historical entries below refer to their
stated revisions. Human developer feedback and manual font testing remain open.

## Installation documentation correction — 2026-10-26

Corrected stale v1.0.0 install commands after the v1.1.0 publication. README now
uses ordinary latest-version commands for global, development and runtime installs,
with an explicit v1.1.0 pinning example and current archive filename. Trial instructions
pin v1.1.0 for reproducibility; troubleshooting and current release summaries agree
with the verified release. Historical release notes and receipts retain their versions.
The README embedded in immutable npm v1.1.0 still has the stale commands; updating
that copy requires owner approval for a subsequent patch publication. No new version
or publication is included in this correction. Verification: all three executable
README/example integration tests passed; repository format check and diff whitespace
check passed. Targeted search found no stale 1.0.0 install commands in current guides.

## Terminal experience v1.1.0 — 2026-10-26

Status: **Complete — v1.1.0 published and verified**. Owner approved publication of the
completed redesign on 2026-10-26. Version 1.1.0 adds display flags; this entry
records changes after the immutable v1.0.0 release. Branch: `codex/terminal-experience`.

- Design: compact branding and quoted selected paths, stacked friendly diagnostic
  titles with stable codes, source locations, actions, accurate success state and
  summary. Syntax errors still skip key comparison; warnings still exit 1.
- Implementation: existing terminal reporter, CLI orchestration and executable only;
  analyzer/parser, JSON renderer/schema, public exports and package dependencies
  unchanged. Added `--no-color`, `--quiet` and `--verbose`. Quiet keeps every finding
  and operational failure visible; clean checks are silent. Quiet/verbose conflict
  is rejected. JSON ignores styling flags and retains identical output.
- Compatibility: per-stream TTY/color policy, NO_COLOR/FORCE_COLOR/TERM=dumb,
  Unicode capability hints and ASCII fallback. Grapheme-aware stacked wrapping
  estimates CJK/emoji cell widths; long labels remain intact across wrapped lines.
  Labels escape terminal controls. Errors omit raw paths/arguments; verbose never
  exposes source lines or values. No runtime dependencies added.
- Verification: 172 tests passed under coverage on Node 20.20.0, including actual
  CLI privacy/exit/JSON regressions and installed-package smoke tests. Parser and
  analyzer each retain 100% line/branch coverage; terminal reporter has 100% lines
  and 97.89% branches. Seven contract tests and installed TypeScript 5.0.4/7.0.2
  positive/negative consumer checks passed. Lint passed. Focused compatibility
  tests passed on Node 20.0.0, 22.13.0, 24.22.1 and 26.12.1.
  Real PTY preview confirmed Unicode and ANSI output with synthetic examples.
- Performance: a maximum escaped-label probe exposed slow ICU segmentation for
  long ASCII tokens. An ASCII fast path reduced this synthetic 1.65 MB report from
  about 10.7 seconds to 52 milliseconds on this Mac/Node 20.20.0 (single probes, not
  a general benchmark). An isolated 128 MiB heap / 10-second regression guard now
  covers it; Unicode continues to use grapheme segmentation.
- Documentation: README quick-start captured from actual CLI; CLI reference includes
  success, warnings, syntax errors, missing-file, JSON and no-color examples.
  CHANGELOG and STABILITY distinguish this update from published v1.0.0.
- Package inspection: `npm pack --dry-run --ignore-scripts` passed with a temporary
  writable npm cache after the default cache returned EPERM. Exactly 21 allowlisted
  files; no fixtures or private configuration files added to the archive.
- Remaining validation: native Windows/Linux and iTerm2/font visual testing of this
  new layout has not been performed. Capability-policy tests simulate those modes;
  historical release CI is not evidence for this update. Human developer feedback
  remains Pending — Requires Human Participation. No publish, tag, release, or
  external messages were performed for this task.

## v1.1.0 publication receipt — 2026-10-26

Owner approved publication of the completed terminal redesign. PR #9 merged as
`4aaa83f9451c985eb0c8fbeb8a3fc7cff90d8938`. Required Quality gates passed on both
the PR and exact main commit, including Windows/Linux/macOS across Node 20/22/24/26
and minimum runtime 20.0.0. Local quality verification passed all 172 tests,
seven contract tests, TypeScript consumer checks, lint and formatting.

Prepared the exact 21-file archive, verified offline consumer installation and
contents, then published as npm ghazi001 with auth-and-writes 2FA and owner browser
verification. npm initially returned processing/404 and later stale latest metadata;
no duplicate publication was attempted. Registry latest now points to 1.1.0, and
registry archive bytes match the reviewed SHA-256:
`fc5ac7b409c8342f7af888ca4200644667d0fb5b24c7eb774891af3df35485b8`.
Fresh unauthenticated ordinary local/global installation, installed CLI exits 0/1/2,
strict TypeScript consumers, API imports and unchanged-input/privacy checks passed.

Created immutable annotated tag v1.1.0 and GitHub release 424516883 after registry
verification. [Durable release receipt](releases/1.1.0.json) records identities and
CI URLs. Manual font/terminal testing and consenting developer feedback remain open;
automated Windows validation is now complete for this update. This approval does
not authorize another future release.

## Initial session scope and inspection

Read `AGENTS.md` completely. The initial directory contained only `AGENTS.md`;
there was no Git repository, implementation, package metadata, or test suite.
Started Milestone 1 as explicitly directed by the agent starting instruction.
The initial discovery gap was closed during the release review below; real user
feedback remains outstanding and must inform later product decisions.

## Milestones (historical first-release scope)

| Milestone             | Status      | Completed                                                                                                                                                                                                                      | Outstanding work and remaining risks                                                                                                                                                                              |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Discovery         | Complete    | Five primary-source competitor reviews; explicit persona/problem/value and v0.1 boundary; three scenarios; pinned Cal.com/Immich/Supabase template evaluation; assumptions and limits documented.                              | Desk research and initial compatibility only. User interviews, adoption evidence and broader real-project feedback remain open.                                                                                   |
| 1 — Repository setup  | Complete    | Initialized Git on `main`; added ESM package metadata, CLI entry point, npm scripts, ESLint, Prettier, EditorConfig, ignore rules, MIT license, README, built-in test runner, naming conventions, and Node.js 20+ requirement. | Foundation checks passed; runtime/platform verification passed under Milestone 5.                                                                                                                                 |
| 2 — Parser            | Complete    | Pure public `parseDotenv` API; portable keys/locations, comments, exports, whitespace, quotes/escapes, line endings/BOM, duplicates, safe syntax diagnostics, bounded input, and value-free results.                           | Physical multiline values remain unsupported and are quarantined. Exact syntax and recovery are documented in docs/PARSER.md; full dotenv compatibility is not claimed.                                           |
| 3 — Diagnostics       | Complete    | Pure analyzeConfig API; key-set comparison, shared diagnostic catalog, six stable codes, actionable recommendations, deterministic ordering, versioned report, and summary counts.                                             | Parser errors deliberately skip differences; external runtime provisioning is not inspected. CLI reporting was delivered in Milestone 4.                                                                          |
| 4 — CLI               | Complete    | Working check command, path options, help/version, terminal/JSON reports, strict arguments, exit codes, safe bounded reads, CI-compatible output, and integration tests.                                                       | CLI contract is unchanged. Native Windows/Linux verification passed under Milestone 5.                                                                                                                            |
| 5 — Testing           | Complete    | 139 tests; 100% local runtime line coverage; seeded invariants, isolated I/O faults, actual-checkout archive/offline installation checks; all 13 hosted runtime/platform jobs passed.                                          | Matrix samples supported runtime lines; Windows skips two POSIX-only tests. Coverage and tests do not replace real-project validation or release readiness.                                                       |
| 6 — Documentation     | Complete    | Reworked README; contribution/security/conduct/changelog and troubleshooting guides; executable examples and scenario guide; verified local install paths, examples, packaged documentation and links.                         | Local and 13 hosted checks passed; no-install fresh-clone quick start verified. Registry ownership, declarations, release metadata and private reporting configuration remain readiness/CI work.                  |
| 7 — CI/CD             | Complete    | Quality matrix and stable gate; weekly dependency updates; restricted SHA-pinned Actions; private reports/security fixes; owner-only candidate environment; private archive/manifest workflow and guard tests.                 | Hosted gate/matrix, candidate artifact/offline consumer, owner approval barrier and main protections verified. Publishing remains disabled; owner notification preferences and release readiness remain separate. |
| 8 — Release readiness | Complete    | Published 0.1.0 identity, ghazi001 ownership, exact 19-file archive and fresh unauthenticated consumer verified; durable receipt retained.                                                                                     | Current unreleased stability source has separate verification/release gates below; existing registry bytes never change.                                                                                          |
| 9 — Publication       | In Progress | npm 0.1.0 and existing annotated tag verified against be996e1; installation instructions and archive integrity checked.                                                                                                        | GitHub release remains absent; npm page UI not independently verified; real developer feedback is outstanding. No further release action is authorized here.                                                      |

## Architectural decisions (historical; current stability work recorded below)

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

## Milestone 6 session — 2026-10-25

Status: **Complete**. Read the project specification, inspected source/contracts,
examples, package allowlist, tests, and clean Milestone 5 commit `fbb1146`.

Completed:

- Reworked the README around the concrete configuration problem and a no-install
  checkout quick start, with full actual terminal output and its expected exit 1.
  Included local global/archive installation, every CLI option, exit statuses, JSON
  result/error distinction, API example, privacy limits, runtime requirements and
  repository links. Kept the unreleased state explicit and avoided registry claims.
- Added CONTRIBUTING.md with clean setup, architecture, naming, privacy, focused
  changes, test/archive verification, safe issue/PR guidance and owner release gates.
- Added SECURITY.md covering controlled error/report boundaries, public metadata,
  input bounds, filesystem/runtime limits, pre-release support and responsible
  disclosure. Followed official GitHub private-reporting guidance with a contact-only
  fallback if private reporting is unavailable; no invented inbox, SLA or bounty.
- Added a concise project code of conduct and an Unreleased changelog covering
  implemented behavior and compatibility limitations without claiming a release.
- Added docs/TROUBLESHOOTING.md for installation/runtime problems, all operational
  and analysis codes, skipped comparisons, malformed quotes, encoding, native paths,
  CI status handling, and safe bug reports. Linked it from the CLI reference.
- Added examples/README.md with local, maintainer and pipeline scenarios plus clean
  and mismatch commands. Added examples/analyze.mjs using public self-reference
  imports, explicit fixture reads and source labels; it runs from another directory.
- Added three example integration tests: exact README terminal output, executed
  README API snippet, clean CLI example, library/CLI JSON equality, example input
  integrity and absence of output files. Updated the test guide.
- Ship SECURITY.md, CHANGELOG.md and troubleshooting with the package; update the
  exact allowlist and archive test to **18 intended files**. Added installed Markdown
  link checks. Contributor/testing/example/progress links in the distributed README
  point to their repository pages, so excluded development assets create no broken
  local links after installation.

Decisions and remaining work:

- No runtime behavior, public API, schema, diagnostic severity, dependencies or CLI
  flags changed. The example's caller-owned file reading remains outside the pure API.
- Keep the npm package small: ship end-user reference/help/security/change history;
  keep contribution/testing guides and synthetic examples in the source repository.
- Private-reporting settings and maintainer notification/contact routing are not
  claimed enabled or tested by adding a policy. Confirm them during repository/
  release setup; the documented fallback shares no vulnerability details publicly.
- No npm name ownership, TypeScript support, registry installation, release dates,
  publication or security certification is claimed. No package/release/tag created.
- All hosted jobs and the clean remote-clone quick start passed as recorded below.

Verification (macOS Node 20.20.0/npm 10.8.2 and GitHub-hosted runners):

- `npm run check`: **142 passed**, zero failures/skips, ESLint with zero warnings
  and Prettier passed. Existing parser/analyzer/privacy/file/package checks passed.
- `npm run test:coverage`: **142 passed**. Every runtime module and the new example
  measured **100% lines/functions**; parser/analyzer also **100% branches**. Reader
  branches remain **96.77%** locally; Windows-specific fallback is in the CI matrix.
- Actual offline package installation verified **18 exact files**, installed byte
  equality, no synthetic environment/unintended files, public imports and executable
  behavior. Every relative Markdown link in the installed package resolves to a
  shipped file. Validated **51** local/repository link targets across **12** documents.
- Executed documented global source installation using a disposable npm prefix and
  cache, offline and with scripts disabled. Installed help/version and clean default
  `check --json` passed from another directory; no system-global installation changed.
- The README's terminal output and API snippet were executed, not invented. The
  CLI mismatch exits 1, the clean comparison exits 0, and the library example exits
  0 after returning the same mismatch report. Example inputs remain byte-identical.
- `git diff --check`: passed. No changes to the owner specification or runtime code.

- For implementation/docs commit `cc99cbe`, [all 13 hosted jobs passed](https://github.com/ghazy001/configpilot/actions/runs/40223251432):
  Linux, Windows and macOS each on Node 20.19.0, 22.13.0, 24.x and 26.x ran clean
  installation, lint, tests, formatting and coverage. Linux Node 20.0.0 passed the
  runtime suite, including the new example and installed-documentation checks.
  Windows retains the documented platform-specific POSIX test skips.
- Cloned the pushed repository into a fresh disposable directory with **no
  node_modules**. Actual help/version, README terminal output and API snippet,
  mismatch JSON and library example from another directory all passed; fixture
  files remained unchanged and no dependency installation was needed. This verifies
  the initial user path independently of the developed checkout's installed tools.
- Standalone `npm run pack:dry-run -- --json --cache /private/tmp/configpilot-npm-cache`:
  passed with exactly **18 intended files**. Security, changelog and troubleshooting
  are included; contribution docs, examples, tests, environment files and progress
  remain excluded. The private publication guard remains set.

## Milestone 7 session — 2026-10-25 to 2026-10-26

Status: **Complete**. Read the full specification and inspected clean Milestone 6
commit `2676379`, source/contracts, existing workflows, tests and actual GitHub settings.

Completed:

- Add stable **Quality gate**, dependent on all matrix/minimum-runtime jobs and
  failing unless both succeed, including skipped/cancelled/failing dependencies.
- Add weekly Monday 08:00 Africa/Tunis Dependabot npm-development and Actions
  updates, bounded PR counts, grouped compatible development minor/patch updates,
  separate majors and no automatic merge/publication.
- Configure and read back private vulnerability reporting, vulnerability alerts and
  automated dependency security fixes. Preserve default read-only tokens and disallow
  workflow PR-review approval. Restrict Actions to checkout/setup-node/upload-artifact
  with required immutable SHA pins. Preserve existing secret-scanning protection.
- Create **release-review**, restricted to main, owner `ghazy001` as required reviewer,
  administrator bypass disabled. Self-review prevention is deliberately false so the
  sole owner can dispatch and manually approve; agents must never provide that approval.
- Add manual-only Release preparation, restricted to upstream main and triggering
  SHA, read-only contents/checks access, no stored checkout credentials or npm token.
  Require successful GitHub Actions Quality gate for the exact commit. Repeat quality
  checks, then inspect/pack/upload only a private candidate and commit/hash/file manifest.
- Add source-only release helpers: safe exact file allowlist, regular tracked files,
  clean commit, new external output directory, dry-run/actual pack equality, offline
  script-disabled package operations, SHA-256 manifest and no existing-directory
  overwrite. Preserve the `private` publication guard; no publishing/tag/release step.
- Test private/path/archive guards; stale/provider/pending/failing CI outcomes; API
  HTTP/JSON/network errors with redacted synthetic tokens; isolated Git candidate
  creation, ignored synthetic environment-file integrity, dirty/untracked rejection,
  no overwrite and a verified archive hash/commit.
- Add docs/CI.md and docs/RELEASING.md; update contributor/testing/security guidance,
  README navigation and Unreleased changelog. No runtime API, schema, severity,
  dependencies or CLI changes. Source-only automation stays outside the 18-file package.

Decisions and remaining work:

- Main protection requires a PR, strict up-to-date **Quality gate** from the GitHub
  Actions app (ID 15368), resolved conversations and linear history; admins included,
  force-push/deletion disabled. Applied only after the new gate passed on main.
- For the sole maintainer, code PRs require CI with zero independent approving
  reviews. Candidate review still requires the owner. Add independent reviewers as
  maintainership expands; do not silently bypass checks to keep working.
- Candidate review is separate from approval to publish. The workflow has neither
  npm authentication nor OIDC/write-content permission and cannot publish a package,
  create a tag or create an external release. Milestone 8/9 readiness/approval remains.
- GitHub settings were read back after application; no test vulnerability report or
  security notification was sent. Owner notification preferences remain personal settings.
- Hosted matrix, candidate artifact/consumer, approval barrier and main protections
  passed as recorded below. Final documentation delivery follows the protected PR
  path rather than bypassing newly enforced main protection.

Verification (macOS Node 20.20.0/npm 10.8.2 and actual GitHub workflows):

- `npm run check`: **148 passed**, zero failures/skips, clean lint and formatting.
- `npm run test:coverage`: all tests executed; core parser/analyzer/runtime behavior
  remains covered. New release-guard and network-preflight paths are exercised with
  isolated synthetic fixtures rather than real credentials or external API requests.
- Parsed CI/release/Dependabot YAML with an available local parser: no syntax errors
  or duplicate keys. This complements, but does not replace, actual GitHub execution.
- Existing package tests verify exactly **18 files**, offline installed API/CLI,
  byte integrity, packaged links and exclusion of synthetic environment files.
- Repository setting read-back confirms SHA pinning, three allowed actions, read-only
  defaults, no workflow PR approvals, private reporting/security fixes and main-only
  owner environment with no admin bypass. Main protection was subsequently applied
  and read back, including required-check provider and administrator enforcement.
- `git diff --check`: passed. No npm package, release tag or external release created.

- Implementation commit `39f7053`: [all 14 Quality jobs passed](https://github.com/ghazy001/configpilot/actions/runs/40225786639),
  including all 12 Linux/Windows/macOS Node 20/22/24/26 combinations, the Node 20.0.0
  minimum-runtime suite, and the stable required gate. Platform skips are documented.
- Dependabot's first [npm update check](https://github.com/ghazy001/configpilot/actions/runs/40225792130)
  and [Actions update check](https://github.com/ghazy001/configpilot/actions/runs/40225792042)
  completed successfully with the restrictive Actions policy enabled.
- [Preparation-only rehearsal](https://github.com/ghazy001/configpilot/actions/runs/40226186022)
  passed: exact-commit API preflight, installation, lint/tests/format/coverage, clean
  private archive generation and explicitly scoped artifact upload. No approval requested.
- Independently downloaded artifact `12610783848`, verified manifest source commit
  `39f7053c01a8e764e8d03ea588ca5af7cd7d3fe9` and archive SHA-256
  `cd176a7c5759f0b7f2bce10f7c6756d3509d6236e6d9226e3b034462c7d5403b`.
  ZIP contained only the tarball/manifest; tarball contained exactly 18 regular
  intended files with the private guard, no environment files, tests or release scripts.
  Offline installation in a separate consumer passed public imports, secret-free
  reports, installed help/version, clean exit 0 and mismatch exit 1.
- [Approval-barrier rehearsal](https://github.com/ghazy001/configpilot/actions/runs/40226442644)
  reached a pending deployment for **release-review** with required user **ghazy001**.
  Verified the API's pending reviewer, then cancelled the test without granting
  approval. A cancelled rehearsal is intentional evidence of the approval boundary;
  the preceding preparation-only run is the successful end-to-end reference.
- Candidate artifact visibility follows GitHub repository access. `private: true`
  blocks npm publication but does not make a public repository's artifacts confidential;
  clarified this in release docs. Only reviewed distributable source/docs are uploaded.
- The final verification record is delivered via a feature branch/PR. Main protection
  remains enabled throughout; merge requires the same complete Quality gate.

## Next task (historical after Milestone 7)

Milestone 8: verify npm name availability/ownership, TypeScript declarations and
consumer compatibility, final metadata/archive/release notes and publishing-security
design. Discovery and real-project evaluation remain open. No npm publication,
release tag or external release is authorized without explicit owner approval.

## Milestone 8 session — 2026-10-26

Status: **In Progress — pre-publication checks complete; package ownership pending first publication**.
Read `AGENTS.md` completely and inspected the clean protected main checkout at
`5123cef2a7d67ac2229d28aaa0c7b2e41444b679`. Work is isolated on
`codex/milestone-8-readiness` and will use required PR checks.

Completed:

- Added `src/index.d.ts` with public options, declaration/location types, frozen
  literal issue codes, parser/analysis issue unions and schema-version-1 reports.
  Narrowing `comparison` makes difference counts numeric or null; narrowing codes
  distinguishes keys, source roles and related locations. No value field is exposed.
- Added `types` metadata and a leading `types` export condition while preserving
  the ESM runtime target, named exports, Node >=20 floor and executable CLI mapping.
  Expanded the exact distribution list from 18 to 19 files for the declaration only.
- Added `npm run test:types` to `check`, using pinned development-only TypeScript
  7.0.2. The compiler uses platform-specific optional development packages; none
  enter the runtime archive. A separate offline consumer compiles positive and
  negative fixtures under strict NodeNext and Bundler resolution, checks library
  declarations, executes emitted ESM and verifies CommonJS dynamic import.
- Retained the ESM-only contract rather than introducing a second runtime build.
  Synchronous require is not promised across Node 20+; CommonJS can import
  asynchronously. Other TypeScript compiler versions are not claimed as verified.
- Reviewed package metadata, MIT license, repository/homepage/issue links, CLI mode
  100755 and private guard. Added draft v0.1.0 release notes and a readiness review;
  updated README, contribution, CI/testing, troubleshooting and preparation guides.
- Queried the explicit public npm registry: configpilot returned E404 on 2026-10-26.
  Owner selected npm username **ghazi001**, distinct from GitHub **ghazy001**.
  npm whoami returned ENEEDAUTH. No name reservation, eligibility, account access,
  2FA status or package ownership has been established by those observations.
- Reviewed current official npm trusted-publishing guidance: prefer future OIDC
  with the exact repository/workflow/protected environment, after an initial package
  exists. Current npm/Node requirements and the owner authentication/2FA boundary
  are documented with primary links in RELEASING.md. No credentials were requested,
  stored in the repository, or created. No registry mutation was performed.

Executed local verification (macOS, Node v20.20.0, npm 10.8.2):

- `npm run check`: passed; lint zero warnings/errors, **148 runtime tests passed**
  with no failures/skips, installed TypeScript checks passed and formatting clean.
- `npm run test:coverage`: passed, 148 tests. All shipped runtime modules have
  **100% line/function coverage**; parser/analyzer have **100% branch coverage**.
  File-reader platform coverage remains 96.77% locally; hosted Windows is separate.
- Actual-checkout pack dry-run/full archive, exact 19-file list, synthetic-secret
  exclusions, installed byte equality, packaged links, executable shim, public
  import and CLI clean/mismatch behavior all passed in the package test.
- TypeScript positive/negative checks and emitted execution passed against an
  independently installed real tarball, with no path mappings into the checkout.
- `npm audit --json` reported **zero known vulnerabilities** at review time for
  the installed development graph. This is time-sensitive advisory evidence.
- Renamed the verification script after the first run revealed Node's test-file
  discovery treated a test-prefixed script as a runtime test. Reran the suite;
  the minimum-runtime job remains independent of compiler installation.

Outstanding and remaining risks:

- Owner authentication and 2FA confirmations are recorded below. Recheck account
  access, 2FA and name eligibility at publication time. Actual package ownership
  cannot be claimed before the first registration/publication.
- Technical candidate and hosted verification are complete as recorded below. Main
  remains protected; no failed or pending mandatory check may be bypassed.
- Milestone 0 product discovery and real-project validation remain unfinished.
  Unit/security checks do not establish adoption or full dotenv compatibility.
- Keep private true and publication disabled. Removing that guard, enabling a
  publisher, staging/publishing, release tags and external releases require explicit
  owner approval. No such action is authorized or performed in this session.

### Milestone 8 candidate and hosted verification

- Clean offline lockfile installation passed with scripts disabled, followed by a
  fresh successful `npm run check` (148 runtime tests plus declaration checks).
- Committed implementation `ff4ac8f63fc4976aa074ee333c81f77f3dac578a` passed all
  **14 Quality jobs** in [PR run 40248270222](https://github.com/ghazy001/configpilot/actions/runs/40248270222).
  This includes every OS/runtime matrix entry and Node 20.0.0. All twelve
  development jobs also exercised installed TypeScript consumers through `check`.
- [PR #2](https://github.com/ghazy001/configpilot/pull/2) was merged through the
  protected workflow. GitHub reported it merged before an agent merge action;
  the agent fetched and fast-forwarded without bypassing protections.
- Merged main commit **692f2d35311ab8c4047b9ea851ea03197460f7bc** passed all
  **14 Quality jobs** in [main run 40248382199](https://github.com/ghazy001/configpilot/actions/runs/40248382199).
- [Preparation-only run 40248726097](https://github.com/ghazy001/configpilot/actions/runs/40248726097)
  succeeded for that exact main commit; the optional owner-review job was skipped.
  No approval was submitted. The archive/manifest artifact is **12619546879** and
  expires after seven days. This artifact is not a public release.
- Downloaded the actual hosted artifact without forwarding GitHub authentication
  to storage. Verified its two-file ZIP, manifest commit/private flag, SHA-256/npm
  integrity, all **19 regular archive members**, byte equality with reviewed source,
  executable CLI and zero runtime dependencies. Offline installation in a separate
  temporary consumer passed strict positive/negative NodeNext/Bundler compilation,
  emitted ESM execution, CLI help/version, clean/mismatch exits and synthetic-secret
  non-disclosure. Temporary consumer files were removed.
- Hosted archive SHA-256:
  `9acc06a13a44ac99a5bc395bba011358eb7f2a94b2c6e6e91db6989742a3ebbe`.
- Local committed candidate preparation also passed and produced 19 files after
  an approved retry using a temporary npm cache. The initial sandboxed preparation
  failed; no guard was weakened. Local candidate source commit was the implementation
  commit above; final hosted evidence is bound to the merged commit.
- At candidate-verification time, account/2FA confirmation was still outstanding;
  the subsequent owner confirmation is recorded below. An E404 lookup cannot prove
  ownership of an unpublished name, which remains pending first publication.
- No npm staging/publication, release tag, GitHub release, npm login, credential
  creation, trusted-publisher mutation or publishing permission was performed.

### npm account confirmation — 2026-10-26

- The owner performed browser login independently and supplied terminal output
  showing successful login and `npm whoami` returning **ghazi001** on the explicit
  public registry. This supersedes the earlier ENEEDAUTH observation.
- The owner explicitly confirmed **2FA enabled**. This is owner-reported account
  evidence; the agent did not inspect credentials, recovery codes or account settings.
- The owner's repeated public lookup returned **E404** for configpilot. The account
  and security checks are complete; an unpublished name is still not reserved or owned.
- Updated README, readiness review and release guide to reflect this evidence.
  The roadmap's literal ownership task remains open until a separately approved
  first publication establishes the package. Milestone 8 therefore remains In
  Progress solely for that ownership confirmation; all pre-publication checks pass.
- This confirmation is not publication approval. Private metadata and publishing
  safeguards remain unchanged. No tag, package publication or external release.
- `npm run check` passed for this documentation update: 148 runtime tests with
  no failures/skips, installed NodeNext/Bundler positive/negative type checks and
  emitted consumer execution, lint and formatting. Archive/offline installation
  checks passed as part of the runtime suite; `git diff --check` passed. Hosted
  Quality checks remain mandatory before merging this update.

## Milestone 9 release review — 2026-10-26

Status: **In Progress — review prepared; explicit release approval pending**.
The owner requested the next milestone after confirming npm login and 2FA. Read
AGENTS.md, inspected clean main at 3f5ca871e5261325328b6c3943887acdc52071ce,
and isolated this review on codex/release-0-1-review. No publication was inferred
from a generic instruction to continue.

Completed for review:

- Read-only npm whoami independently returned **ghazi001**. A fresh explicit
  registry lookup returned E404 for configpilot. Owner-reported 2FA remains the
  account-security evidence; no credentials or recovery codes were inspected.
- The final owner-confirmation main commit passed Quality workflow
  [40250068526](https://github.com/ghazy001/configpilot/actions/runs/40250068526).
- Closed Milestone 0's desk-research gap because discovery/real-project evidence
  was an outstanding release-review risk. Reviewed five competitors using primary
  docs, defined persona/problem/value, v0.1 included/excluded scope, three scenarios,
  and explicit unvalidated assumptions in DISCOVERY.md. This adds no product feature.
- Evaluated commit-pinned public Cal.com, Immich and Supabase templates: 174, 6
  and 71 accepted unique keys; no parser issues; actual CLI self-checks exited 0.
  Repeated API reports matched; input hashes remained unchanged; controlled
  synthetic variants each produced one missing and one undocumented key. Source
  URLs, hashes, methodology and privacy assertions are in REAL_PROJECT_EVALUATION.md.
  No upstream project code was run and no template values were committed.
- Directus had no matching example-template candidate in its inspected current
  tree and was not reported as passing. Real user interviews/adoption evidence
  remain open; three samples do not establish complete dotenv compatibility.
- Prepared a new private candidate from the CI-verified source commit above, using
  the unchanged safe helper. Its exact 19-file archive has SHA-256
  **8a0eb298dea440359bfac20f2ec436d908636efbfe24c5987ca3abecf5194845**.
  Local review artifact and manifest are outside the checkout at
  /private/tmp/configpilot-v0.1.0-review-20261026. This is not publishable metadata.
- Added RELEASE_PLAN_v0.1.0.md: proposed configpilot@0.1.0, publisher ghazi001,
  public npm registry/latest tag, v0.1.0 Git tag and GitHub release. It defines the
  metadata/guard PR, final CI/archive review, interactive owner 2FA, publication
  verification, registry installation, release notes and ownership checks after
  explicit approval. First-publication local authentication has no OIDC provenance;
  a future protected trusted publisher needs its own verified setup.

Verification and remaining work:

- Runtime tests (148), installed TypeScript checks and lint passed during the first
  check run; formatting caught two newly written documents. Formatted those files
  and reran final checks after documentation edits, with results recorded below.
- Private true, package file allowlist, production code, workflows and publishing
  permissions remain unchanged. No npm publication/staging, Git tag, GitHub release
  or trusted-publisher mutation was performed.
- Publication approval, actual package ownership, public-registry installation,
  final release metadata/date and release URLs remain outstanding. Do not mark
  Milestones 8 or 9 complete until their registry/ownership checks actually pass.

Final local verification for the release review:

- `npm run check` passed: 148 runtime tests, zero failures/skips; installed strict
  NodeNext/Bundler positive/negative declaration checks and emitted execution;
  lint zero warnings/errors and all formatting checks clean.
- Independently inspected the new candidate's complete 19-file archive. SHA-256
  and npm integrity matched; every archived byte matched the CI-verified source;
  CLI executable/shebang, private version metadata and zero runtime dependencies
  were verified. No new review/discovery documents enter the package allowlist.
- Installed that exact archive offline into a new temporary consumer. TypeScript
  checks in both modes, emitted ESM, CLI help/version/clean/mismatch exits and
  synthetic-secret non-disclosure all passed. Temporary consumer files were removed.
- `git diff --check` passed. This session changes release-review documentation only;
  product code, package metadata, preparation guards, dependency graph and workflows
  remain unchanged. Required hosted CI must pass before merge.

## Approved v0.1.0 release execution — 2026-10-26

Status: **In Progress — owner approved; final archive/registry verification pending**.
The owner explicitly answered “yes go ahead” to the concrete request covering
reviewed private-guard removal, configpilot@0.1.0 publication as ghazi001, v0.1.0
Git tag and GitHub release. This authorizes this first release only; no additional
publication permission is inferred for future versions or different names.

Implementation prepared on codex/release-0-1-0 from clean main 922bf7b:

- Removed private true and added explicit npm registry, public access and latest
  dist-tag metadata. The exact 19-file allowlist, runtime exports/API and Node >=20
  floor are unchanged; no runtime dependency or lifecycle hook was added.
- Updated candidate guards to accept historical private candidates or stable
  numeric versions with exactly the explicit public registry/access/latest options.
  Wrong destinations, restricted access, other tags, prereleases, unknown options
  and ambiguous private false metadata fail closed. Preparation never publishes.
- Manifests now report actual private status and, for public candidates, explicit
  publication options. Clean/tracked/regular source checks, offline scripts-disabled
  packing, exact file lists, hash binding and no-overwrite safeguards remain.
- Added rejection tests for public metadata and an integration test that prepares
  a public candidate and verifies its commit, publication fields and archive hash.
  The package integration test now asserts the approved publication metadata.
- Finalized the 2026-10-26 release notes/changelog and npm installation instructions;
  updated release/readiness/contribution policies without claiming registry checks
  have already passed. The initial publication uses interactive owner 2FA, with no
  GitHub OIDC provenance claim. Workflows retain their read-only preparation role.

Verification results, final immutable source/archive identity and actual registry/
release outcomes will be recorded after execution. Milestones 8 and 9 remain In
Progress until actual ownership and public installation have been verified. No
publication, tag or GitHub release has occurred at this preparation stage.

Pre-PR release verification (macOS, Node v20.20.0, npm 10.8.2):

- `npm run check` passed: **149 tests**, zero failures/skips; installed strict
  TypeScript positive/negative checks and emitted ESM/CommonJS import passed;
  lint zero warnings/errors and all formatting clean.
- `npm run test:coverage` passed: 149 tests; all shipped runtime modules have 100%
  line/function coverage, parser/analyzer 100% branch coverage, and release guards
  100% line/branch/function coverage. Local file-reader branch coverage is 96.77%.
- Actual-checkout dry-run/full archive, synthetic secret exclusion, exact 19 files,
  executable shim, installed byte equality, public imports and CLI exits passed.
- Existing private-candidate tests remain; the new public candidate carries exact
  explicit publication fields and a matching clean commit/archive hash.
- The approved release PR and merged main commit must both pass required Quality
  CI before the final publishable archive is built and npm publication begins.

- Fresh npm advisory audit reported zero known vulnerabilities for the current
  development graph at release preparation time. This is time-sensitive evidence.

## Stable v1 audit and implementation — 2026-10-26

Status: **In Progress**. The owner approved necessary stability work after the
read-only audit of clean main be996e1. Read AGENTS.md completely and isolated work on
codex/stable-readiness. Version remains 0.1.0; no publication/staging, new tag,
external release or public security disclosure is part of this local work.

The audit confirmed cross-loader quote ambiguity could expose credential-body
fragments as duplicate key names, excessive report growth for dense 1 MiB inputs,
and contradictory release/support docs. Its executed baseline was 149 tests and
100% core coverage, demonstrating that coverage alone missed the privacy defect.

Completed implementation:

- Keep existing unambiguous single-line syntax; quarantine later plausible quote
  boundaries and overlapping malformed blocks. New parser/API/actual CLI privacy
  regressions cover all quote styles, line endings and paired backslash runs.
- Enforce per-input 2048 declaration/invalid-line records, 4096-code-unit public
  labels and 131072-code-unit emitted metadata. Fixed RangeError or CLI
  INPUT_LIMIT_EXCEEDED/exit 2 returns no partial report. Blank/comment/quarantined
  body lines do not consume records. Document the compatibility effects.
- Export JSON Schema 2020-12 through configpilot/schema.json; validate complete,
  skipped and operational envelopes and reject unsafe structural mutations.
  Preserve the three named runtime exports, six analysis codes and schema 1.
- Add pinned development-only dotenv 18.0.9, Ajv 8.20.0 and a TypeScript 5.0.4 alias.
  Runtime dependencies remain empty. Test 99 conventional reference cases,
  intentional grammar differences and quote/backslash mutations.
- Verify installed TypeScript 5.0.4 and 7.0.2 under strict NodeNext/Bundler with empty
  type roots, negative fixtures and emitted ESM/CJS dynamic import. Correct the
  default-export negative test: TS5 synthetic-default imports can compile, so assert
  namespace shape and exact runtime exports instead of relying on that compiler rule.
- Add a fail-closed 90% parser/analyzer line/branch coverage floor and isolated
  resource probes, including Linux/Node 24 CI wiring. Preserve minimum-runtime
  tests without development dependencies. The archive now contains 21 exact files.
- Correct current release/security status and retain immutable published 0.1.0
  identity in docs/releases/0.1.0.json. That historical 19-file archive and existing
  tag correspond to be996e1; it does not contain current fixes. No GitHub release
  was present at read-only verification. Never publish changed bytes as 0.1.0.
- Run six pinned public-template evaluations, now reproducible through the manual
  scripts/evaluate-public-templates.js and value-free corpus manifest. Cal.com,
  Immich, Supabase, Outline, Twenty and Novu passed, with 174/6/71/87/7/8 keys.
  Reference key agreement, deterministic API, actual CLI, unchanged hashes,
  synthetic missing/extra and duplicate checks passed for every source. Upstream
  code was never installed/executed; public inputs were deleted after checks.
- Add STABILITY.md with audit IDs, mandatory gates and optional deferred features;
  VALIDATION.md provides a consented developer-trial protocol without collecting
  real configurations. Apply and read back immutable v* tag protection under the approved release-hardening scope.

Decisions and remaining gates:

- Prefer conservative suppression over exposing possible credential fragments;
  dense inputs fail explicitly rather than yielding misleading truncated reports.
  These compatibility effects and the new operational code are documented before
  any release. No redundant strict flag, process.env merge, full dotenv loader,
  automatic rewriting, dual CJS build or advanced integrations were introduced.
- Published 0.1.0 remains unchanged. New code requires a reviewed unused version
  and exact artifact approval. No standing publication permission is inferred.
- Actual developer feedback is still absent. Complete 3–5 trials and resolve
  material findings before declaring stable v1.0.0.
- Current-source hosted Windows/Linux/macOS CI is pending; historical green CI does
  not verify these changes. SECURITY.md prohibits vulnerability details/reproductions
  in public PRs/logs. Keep the security patch local pending coordinated public
  delivery approval or an appropriate private review/CI route. No public message
  or vulnerability report is sent on the owner's behalf.

Verification is recorded below as final checks complete; do not infer hosted or
real-user success from local tests or public-template sampling.

Final local verification for stability implementation:

- Clean offline lockfile installation with scripts disabled passed. `npm run check`
  on Node 20.20.0 passed: **161 runtime tests + 6 independent contract tests**, zero
  failures/skips, lint zero warnings/errors, both installed compiler checks and
  formatting clean. The six-project manual evaluation passed separately.
- `npm run test:coverage` passed: parser/analyzer **100% lines/branches/functions**;
  every shipped runtime module has 100% lines/functions. Reader remains 96.77%
  branches locally. The new 90% line/branch gate fails on missing/malformed metrics.
- Downloaded isolated official macOS ARM64 Node 20.0.0, 22.13.0, 24.22.1 and 26.12.1
  binaries and verified their archives against official SHA-256 manifests. Node
  20.0.0 passed all 161 runtime tests. Full check, coverage and five resource probes
  passed on 22.13.0/24.22.1/26.12.1. After adding the last mutation test, the expanded
  six-contract suite separately passed on each of those three runtimes.
- Initial cross-version coverage enforcement failed because newer Node prints a
  directory tree instead of flat paths. Replaced text scraping with structured
  test:coverage events and a compact reporter, kept a human TAP reporter, added
  rejection/reporting tests and reran successfully on every tested version.
- Resource probes stayed below 5 MiB JSON/256 MiB RSS. Highest measured per-process
  RSS: Node 22.13.0 **110.23 MiB**, Node 24.22.1 **165.84 MiB**, Node 26.12.1
  **179.45 MiB**; largest probe output **1,854,703 bytes**. Dense 1 MiB declarations
  now fail safely. These are isolated local measurements, not all-platform guarantees.
- Actual checkout archive/offline installation tests passed: exactly **21 files**,
  executable shim, installed byte equality, schema resolution, parser privacy fix,
  safe resource errors, API imports, documentation links and synthetic-secret
  exclusion. Standalone dry-run also passed (31,453 packed / 106,392 unpacked bytes
  at that check); final candidate hashes are recorded after committed preparation.
- npm 10 advisory audit failed through a retired quick endpoint with the alias
  dependency graph. Retried using isolated npm **11.21.1**; it succeeded with
  **zero known vulnerabilities**. No global npm change or runtime dependency added.
- SECURITY.md, release receipts, version metadata and docs were reviewed together.
  No configuration contents were uploaded, and the analyzer/CLI made no network
  requests or project-code execution during analysis. Real public examples were downloaded with GET only; only identity,
  digests and counts were logged. All configuration fixtures are synthetic.
- Hosted CI for this new branch and real developer trials remain unverified and
  are not replaced by the local runtime matrix. Public security delivery and a
  new-version release still need appropriate owner coordination/approval.

- Applied and read back active tag ruleset **25863373 / Immutable release tags**:
  refs/tags/v* updates/deletions are blocked, bypass actors empty, new creation
  remains available for separately approved releases. Existing tags were preserved;
  no tag/release was created and no destructive test was run.

### Committed validation candidate and owner disclosure decision

- Implementation committed locally as **83ba72694aa6a79fe9911bb1e305c6733ba1af5a**.
  Clean committed preparation passed with the unchanged offline/scripts-disabled
  helper. Candidate directory: /private/tmp/configpilot-stability-validation-83ba726.
- Candidate SHA-256: **454b38deb525c5e28b8ceb141420d1bbf5dffa07c18f81749b3d9e67de0bc9cc**.
  npm integrity: sha512-Vg9GeA9GRBGKZU33tJKdDLeWUHJ6JhWidggEVjbDCH+aPpd4Fnpx+8DhWRD+tHxiLAMh9Wb9Yj3juKryvFlKTw==.
  Independently checked all 21 regular tar members, exact allowlist, byte equality
  with source, executable/LF CLI and manifest commit/hash/integrity. Fresh offline
  consumer passed imports, strict NodeNext/Bundler checks, emitted ESM/CJS dynamic
  import, installed CLI help/version/0/1/2 statuses, new quote privacy regression,
  INPUT_LIMIT_EXCEEDED and input integrity. Consumer files were removed afterward.
- This is a **validation-only archive with existing version text 0.1.0**, not a new
  release candidate authorized for publication. Its bytes differ from the public
  archive and must never be published under that existing name/version. Final release
  needs an unused version and fresh exact artifact approval after remaining gates.
- Asked for a concrete disclosure decision only after the fix and validation archive
  were reviewable. The owner explicitly selected **Keep private for coordinated
  review**. Do not push this branch, create a public PR, upload it to a public artifact
  or run public hosted CI. No public disclosure or publication permission is inferred.
- Implementation/validation docs remain available locally for private owner review.
  A private cross-platform CI/review route and real developer feedback remain open;
  stable v1.0.0 is not declared complete. The follow-up commit records evidence only
  and changes no shipped candidate bytes.

### 2026-10-26 — Continued stable-readiness work (private)

The owner requested continued package improvement until it is mature enough for
stable v1.0.0. The earlier keep-private decision remains in force. This is an
additional stability milestone; version remains 0.1.0 and publication is deferred.

Completed work:

- **CP-012 / P0 / parser privacy:** synthetic differential probes found 33 initial
  whitespace/quote combinations where dotenv recognized a credential body but the
  parser retained body fragments as declarations/duplicate names, even when analysis
  ultimately skipped comparison. Two focused regression tests failed before the fix.
  Reject nonportable whitespace immediately before quoted values with the existing
  INVALID_DECLARATION code and reuse conservative body quarantine. Single-line
  occurrences are also rejected; unquoted opaque Unicode and supported spaces/tabs
  keep their behavior. No values were real and no public report was sent.
- Add API, both-role terminal/JSON CLI, unchanged-byte and installed archive tests.
  Expand the independent corpus by 2,835 cases across all 21 ECMAScript whitespace
  characters outside supported space/tab/CR/LF, three delimiters/endings, headers and
  closing-line variations. Default/fast pinned dotenv each recognize 2,268 bodies;
  the running Node util.parseEnv loader is an additional independent oracle. Every
  recognized body must stay out of parser/analyzer metadata; reports validate against
  the schema. Grammar compatibility is not expanded or overstated.
- Add dependency-free `candidate:verify` for a reviewed local source/archive pair:
  manifest/digests/committed bytes, offline scripts-disabled installation, exact
  installed file list/byte equality, public imports/schema, platform shim and actual
  clean/mismatch/skipped/operational CLI workflows. It emits a value-free identity/OS
  receipt, suppresses native subprocess errors and removes disposable consumers/cache.
  The archive/manifest and checkout are not modified. TypeScript/full matrix checks
  remain separate; this command neither publishes nor authorizes publication.
- **CP-013 / P1 / release correctness:** a synthetic local index with assume-unchanged
  hid changed shipped bytes from git status, allowing preparation to claim an
  inaccurate source commit. The new regression failed before the fix. Preparation
  and acceptance now compare committed Git blobs directly. Wrong digests/commits,
  unsafe manifest paths, changed allowlists, hidden source edits and rehashed changed
  archive bytes are rejected before installed code execution. This is release
  identity hardening; it is not an application runtime exploit or publishing bypass.
- Wire offline acceptance before artifact upload in the preparation-only workflow;
  include the value-free receipt. No workflow was dispatched or publicly uploaded.
- Update parser/compatibility notes, changelog, testing, release, trial and stability
  docs. Re-evaluate all six pinned public templates successfully after the fix.

Verification and replacement candidate identity are recorded below after final
checks. Current-source Linux/Windows execution and consenting human trials remain
outstanding. Local Docker is installed but its daemon is unavailable; no Linux
success is inferred. No person was contacted and no external review is fabricated.

Final verification for this continued stability milestone:

- Offline lockfile installation with lifecycle scripts disabled passed. Full
  `npm run check` passed on local macOS ARM64 with Node **20.20.0, 22.13.0,
  24.22.1 and 26.12.1**: **165 runtime tests + 7 contract tests**, zero failures
  or skips, lint clean, TypeScript 5.0.4/7.0.2 installed consumers and formatting
  passed. After the last source-binding change, reran the full checks on all four.
- Minimum Node **20.0.0** passed the final **165** runtime tests, including private
  acceptance and hidden-index source-binding regressions. Contract checks run only
  on development-supported runtimes with their development dependencies installed.
- Final `npm run test:coverage` passed on Node 20.20.0: parser and analyzer each
  **100% lines/branches/functions**. All **165** tests passed. Coverage remains a
  regression signal alongside assertions, not proof of complete grammar support.
- Five isolated resource probes passed on Node 20.20.0 after the parser change:
  largest report **1,854,703 bytes**, highest peak RSS **103.63 MiB**; all below
  the 5 MiB/256 MiB budgets. No broader benchmark or all-platform claim is made.
- Six pinned public templates reran successfully on the current parser: identical
  hashes/key sets, reference agreement, clean CLI exit 0 and synthetic drift/duplicate
  expectations. GET requests downloaded public examples only; no local code,
  private input or reproduction was uploaded. Temporary public files were removed.
- `git diff --check` passed. The package allowlist remains **21 files**, zero
  runtime dependencies and ESM-only API; no package version, tag or release changed.
  The new verifier/scripts/tests do not ship in the npm archive. Workflow changes
  are local only and retain read-only permissions with no publication command.

Local engineering changes are complete for this milestone. Prepare and verify the
committed replacement archive next, then retain its identity below. Stable v1 still
requires current-source native Linux/Windows checks, real developer trials and final
security/compatibility/API/owner approval; the private-delivery decision is preserved.

### Replacement archive and private Linux verification

- Implementation committed as **6e827ae7af1cfa01c008084133dff531351adcc5**.
  Prepared the clean tracked source with the strengthened helper and inspected
  the exact **21-file** archive. Validation-only directory:
  /private/tmp/configpilot-stability-validation-6e827ae.
  SHA-256: **8cdcc32c6d8c33bd48d7cef05e042884f94601f90b20a7c94a5bdc97b98c8483**.
  npm integrity: sha512-hhznssYYU9gdb+mV5uKbVpjXSvwWnpXn5hSj3kjFZ1VhHH2YrJ/GrIxwSV0gQPGg0tR5LdysY+XWWQTLz1aKww==.
- Reusable `candidate:verify` passed against those exact bytes on macOS ARM64
  **Node 20.0.0, 20.20.0 and 24.22.1**. Value-free receipts remain beside the
  manifest/archive. They cover committed source identity, digest verification,
  offline installation, byte equality, ESM/dynamic-CJS imports/schema, executable
  shim, actual CLI help/version/0/1/2, privacy/resource failures and unchanged inputs.
- A one-off expanded audit on Node 20.20.0 examined every BMP code-unit prefix
  across three quoted styles: **196,608 cases**, **75** loader-recognized body
  cases, **zero** fragments retained in parser metadata. References were default
  and fast pinned dotenv plus util.parseEnv. This supplements the permanent 2,835
  whitespace corpus; it is not exhaustive grammar/Unicode compatibility evidence.
- Recovered a private Linux route by starting the installed Docker Desktop engine.
  Downloaded the official Node **24.22.1-bookworm** image, pinned for execution as
  **node@sha256:6449e19d8184d84062525b6a7524def03146c2cb04a7f08b076680d0e8e4240a**.
  Used only a read-only local Git bundle and read-only candidate directory; the
  owner's environment files, npm credentials and Docker socket were not mounted.
  Disposable source/cache were kept in container temporary filesystems, running
  as uid 501 with dropped capabilities, no-new-privileges and a read-only root.
- Registry access downloaded locked development dependencies with lifecycle scripts
  disabled (**87 packages**, npm **11.19.1**). Then disconnected container networking
  and verified its networks were `{}` before and after executing checks.
- **Linux ARM64 / Node 24.22.1:** full `npm run check` passed **165 runtime + 7
  contract tests**, **zero failures/skips**, clean lint/format and both installed
  TypeScript consumers. Coverage reran all 165 tests successfully; parser/analyzer
  remained **100% lines/branches/functions**. Five resource probes passed, highest
  peak RSS **165.16 MiB**, largest JSON **1,854,703 bytes**, below the documented budgets.
- The **same macOS-prepared archive** passed offline Linux `candidate:verify`, with
  matching source/hash/file bytes and installed shim/API/CLI behavior. Its receipt
  is verification-linux-node24.json beside the archive. Source Git status remained
  clean. Removed the task's container and temporary source Git bundle/tar afterward;
  private candidate/receipts and value-free logs remain locally for review.
- This closes one real Linux compatibility gap without public code/CI upload.
  **Windows and remaining Linux matrix entries, consenting developer trials and
  final owner review remain open.** No external person was contacted. No public PR,
  push, tag, release or npm publication occurred. Version stays **0.1.0**; this changed
  archive must never be published under that already-existing version.
- The follow-up documentation records evidence only and changes no shipped archive
  bytes. The older 83ba726 validation archive lacks CP-012 and is superseded for
  current review; public 0.1.0 remains the distinct historical npm release.

### Remaining private Linux runtime matrix — 2026-10-26

Status: local Linux runtime matrix **Complete**; stable release validation remains
**In Progress**. No source behavior or shipped bytes changed in this session.

- Reused the pinned official Node 24 Linux ARM64 image recorded above. Downloaded
  official Linux ARM64 Node **20.0.0, 20.19.0, 22.13.0 and 26.12.1** archives and
  verified each against its official SHA-256 listing before extraction.
- Created a disposable nonroot container from a read-only source Git bundle and
  read-only candidate mount. Installed 87 locked development packages with scripts
  disabled, then disconnected networking. Networks were `{}` throughout testing
  and at final inspection; no private source, reports or credentials were uploaded.
- Full `npm run check` passed on **20.19.0, 22.13.0 and 26.12.1**: each ran
  **165 runtime + 7 contract tests**, zero failures/skips, lint and formatting,
  installed TypeScript 5.0.4/7.0.2 NodeNext/Bundler positive/negative checks and
  emitted ESM/CommonJS dynamic import checks.
- `npm run test:coverage` passed separately on all three runtimes: **165 tests**
  each, parser/analyzer **100% lines, branches and functions**. Minimum Node
  **20.0.0** passed all **165 runtime tests**, zero failures/skips; modern
  development tools were not run under that unsupported development runtime.
- The same 21-file archive from implementation commit **6e827ae** passed offline
  `candidate:verify` on all four added runtimes. Source/hash/installed bytes matched;
  imports, schema, npm shim, CLI exits, privacy/resource failures and unchanged
  input checks passed. Receipts remain in the candidate directory as
  `verification-linux-<version>.json`; quality/coverage logs are local under
  `/private/tmp/configpilot-linux-{check,coverage}-<version>.log`.
- The private source checkout stayed clean. Removed only this task's container
  and temporary Git bundle after retaining receipts. Earlier Linux Node 24 resource
  results remain applicable; no new performance measurement is claimed.
- Read-only Parallels inventory returned no registered VMs. Thus no local Windows
  run is available or claimed. Linux/macOS evidence is ARM64 and does not establish
  hosted x64 results. Windows/remaining hosted-platform evidence, 3–5 consented
  developer trials, final security/API review and exact-release owner approval
  remain open. No external participant was contacted.
- No push, public CI, release, tag, npm publication or version change occurred.
  The unchanged validation archive still says 0.1.0 and must never be published
  under that already-existing version.

### Hosted compatibility, security/API review and trial kit — 2026-10-26

Status: hosted compatibility **Complete**; maintainer security/API review **Complete**
for the current implementation; external feedback **Pending — Requires Human Participation**.

- Owner authorized GitHub-hosted windows-latest testing and will distribute the trial
  package after participants consent. The latest instruction explicitly withholds
  v1.0.0 publication, release tags and public releases until separate approval.
- Created and verified private owner repository `ghazy001/configpilot-private-validation`,
  then pushed only reviewed revision **f3c99164f9a3479d90908a00353a545d92451475** to
  its main branch. Public upstream was not pushed; no public PR/release was created.
- Private Quality run **40305989425** passed all **12 OS/runtime jobs**, the minimum
  Node **20.0.0** runtime job and final **Quality gate**. Windows used Node
  **20.19.0 / 22.13.0 / 24.22.1 / 26.12.1**; Ubuntu/macOS 24.x resolved to
  **24.21.0**. Other development matrix versions matched their requested versions.
- Each Windows runtime ran **165 tests: 163 passed, 2 documented POSIX-only skips,
  zero failures**. Skips were permission behavior and FIFO/device checks. Each ran
  **7 contract tests**, zero failures/skips, lint/format, installed TypeScript
  5.0.4/7.0.2 checks and installed package/shim tests. Coverage independently passed
  with parser/analyzer **100% lines/branches/functions** on all four Windows jobs.
  Do not report those Windows runs as zero-skip runs.
- Hosted Ubuntu Node 24.21.0 resource probes all passed: max RSS **168.61 MiB**,
  largest JSON **1,854,703 bytes**. Downloaded/inspected the private log archive
  `/private/tmp/configpilot-private-matrix-40305989425.zip`; job metadata is retained
  locally. Matrix results apply to the reviewed source, not a future version bump.
- Completed a direct maintainer review of runtime modules, types/schema, diagnostic
  contracts and preparation/verification controls; no additional confirmed blocker
  found. Scope, evidence, residual boundaries and proposed freeze are documented in
  `docs/SECURITY_API_REVIEW.md`. This is not an independent security certification.
- Fresh macOS Node20.20 quality check passed **165 runtime + 7 contract tests**, no
  failures/skips, lint/type/format. npm **11.21.1** advisory audit succeeded with
  **zero known vulnerabilities** across the locked graph. Exact 21-file candidate
  acceptance passed again; published-version text and shipped bytes remain unchanged.
- Prepared `docs/DEVELOPER_TRIAL.md`, a structured feedback form, installation
  instructions and three synthetic frontend/service/CI scenarios. The local kit is
  `/private/tmp/configpilot-developer-trial-6e827ae.zip` (12 files), SHA-256
  **105ebed69087395ce50df5e251a392c4eeb277b0b35145adbe8e12a5b86369b7**.
  Zip integrity/contents passed inspection; all three scenario expectations passed
  actual CLI checks. The kit includes the unchanged reviewed candidate and per-file
  checksums, not real configuration. These automated checks are not human trials.
- Added an optional manual Windows runbook. Its commands are documented, not falsely
  claimed executed; hosted CI provides the actual Windows evidence above.
- Remaining: owner-arranged human trials and feedback resolution, final API freeze,
  approved unused version and final archive, then explicit publication/disclosure
  approval. No participant was contacted, no trial outcome invented, no package
  version changed and no package/tag/release published.
- Final documentation formatting and `git diff --check` passed. The local commit
  attempt was not executed: automatic approval review could not complete because
  its usage limit was reached, not because it determined the action unsafe.
  The seven documentation files remain saved and uncommitted; no approval bypass
  was attempted. The owner reiterated that engineering should continue toward a
  mature v1.0.0 and publication will be a later joint decision.

### Owner-approved v1.0.0 preparation — 2026-10-26

- Owner explicitly requested: “okay let's realse the new version v1.0.0”. This
  authorizes the v1.0.0 release/public delivery after verification; prior hold on
  publication is superseded for this version. No future publication is authorized.
- External developer feedback remains **Pending — Requires Human Participation**,
  accepted as a post-release activity, not a fabricated completed requirement.
- Prepared version 1.0.0 in package/lock metadata, stable API/CLI documentation,
  migration notes and support policy. Simplified normal installation commands:
  global CLI, project development dependency, or ordinary runtime dependency.
  `--ignore-scripts`, `--no-audit`, `--no-fund` remain optional test controls, not
  package requirements. The package has no install scripts or runtime dependencies.
- Existing npm authentication identifies ghazi001 and registry metadata lists that
  maintainer; 1.0.0 was absent at preflight. Final verification/publication receipts
  follow. No successful publication is inferred from authorization or metadata edits.

### v1.0.0 publication execution — 2026-10-26

- Committed release preparation as 244393c; PR #7 passed all 12 development
  OS/runtime jobs, minimum Node 20.0.0 and Quality gate in run **40316371393**.
  GitHub reported PR #7 merged as **66b4ad2cc0f39f507fb5cb94f6c08e458a42d88d**;
  the full merged tree exactly matched the reviewed branch. Exact-main Quality
  gate then passed in run **40316620730** before publication.
- Local v1 checks: 165 runtime and 7 contract tests passed with zero failures/skips;
  lint, format, TypeScript consumers and core 100% line/branch/function coverage
  passed. Five resource probes passed (largest JSON 1,854,703 bytes, max RSS 103.38 MiB).
- Prepared the final clean-main archive under
  `/private/tmp/configpilot-v1-final-66b4ad2`: exact 21-file allowlist, executable
  CLI, no environment files or unintended contents. SHA-256:
  **3f64ab069fde5df4c2425420dda2463b20ebbf9cd430f8e3424150cf63f0e0be**.
  Integrity: sha512-HTPeBKh6h3otlHe7ejUXJgjvr4UZuwZXWhBEoc6ewCXW8yxqlz9Yk92nrB4AKHgontOPE2WwC8MaZ/MUPfP4cw==.
  Preflight and merged-main archives are byte-identical. Offline acceptance and
  fresh installed API/CLI/type checks passed. Initial local preparation could not
  complete with the default npm cache; a dedicated writable temporary cache resolved
  it without weakening guards or changing the package.
- npm identity is ghazi001; 2FA readback was auth-and-writes. Owner completed npm's
  browser challenge privately. Publishing the exact verified archive returned exit 0
  and `+ configpilot@1.0.0`; npm said processing may take a few minutes. Registry
  verification is pending until processing completes; no duplicate publish attempted.

- Registry processing completed: v1.0.0 is publicly available and latest points to
  1.0.0. Downloaded tarball bytes, SHA-256 and npm integrity exactly matched the
  reviewed archive; maintainer is ghazi001. Fresh unauthenticated ordinary
  `npm install configpilot@1.0.0` and global installation in an isolated prefix
  passed without ignore-scripts/no-audit/no-fund. Installed byte equality,
  ESM/CommonJS dynamic import, strict TypeScript consumer, CLI exits 0/1/2,
  privacy and unchanged synthetic input checks passed.
- Created annotated **v1.0.0** at source **66b4ad2**, tag object
  **5e9f1318278f05809c6e76dadcded0e647313552**, then verified and created GitHub
  release **424183269**: https://github.com/ghazy001/configpilot/releases/tag/v1.0.0.
  No old tag/archive was modified. Manual 2FA publication has no OIDC provenance.
- Durable identity and actual verification results are in `docs/releases/1.0.0.json`.
  This completes the approved release. Human feedback stays pending as accepted
  post-release work; no user trials or independent audit are claimed.

## Discovery / initialization feature (local, unreleased)

Owner scope: implement all 15 feature milestones, no push/tag/release/publication.
Package version remains 1.1.1. Existing release evidence above is historical.

- [x] 1 Inspection/architecture: CLI, parser, analyzer, diagnostic/report contracts,
      declarations, package safety and tests reviewed; architecture recorded in
      DISCOVERY_ARCHITECTURE.md. No baseline tests rerun yet; prior results are historical.
- [x] 2 AST scanner
- [x] 3 Classification
- [x] 4 Configuration selection/comparison
- [x] 5 Safe initialization
- [x] 6 Placeholders
- [x] 7 File safety
- [x] 8 CLI presentation/confirmation
- [x] 9 Check onboarding
- [x] 10 Public API/declarations
- [x] 11 Security/performance review
- [x] 12 Automated tests
- [x] 13 Documentation
- [x] 14 Public-project validation
- [x] 15 Final local quality review (native Windows/Linux follow-up pending)

### Feature verification (local)

Milestones 2–14 implemented. Seven initial focused tests passed, then the expanded
suite passed 184 tests and seven independent contract tests. Installed TypeScript
5.0.4/7.0.2 NodeNext/Bundler positive/negative consumers passed. Pure and filesystem
APIs preserve old exports. Parser dependency graph is pinned/locked; npm audit
--omit=dev reported zero known advisories on 2026-10-26 (not proof of no vulnerabilities).
New offline acceptance preseeds the pinned dependency graph from installed locked
dependencies; package source/archive identity checks remain strict. Minimum-runtime
CI now installs runtime dependencies before testing. No workflow was pushed/run.

Public-source trials at five pinned repositories completed; exact files, measured
runtime/RSS, generation/CLI results, zero-reference cases and corrected JS-JSX / TS
decorator gaps are in SOURCE_DISCOVERY_VALIDATION.md and its JSON record. Node 20.0.0
focused tests passed before the final corpus fixes; final reruns follow below.
No real user feedback, new native Windows/Linux result, publication or push is claimed.

### Final feature result — 2026-10-26

All 15 milestones implemented and locally reviewed. Final npm run check passed:
187 tests, seven independent contracts, installed TypeScript 5.0.4/7.0.2
NodeNext/Bundler positive/negative cases, emitted ESM and CommonJS dynamic import,
lint and format. Expanded offline package test exercises installed scanSource,
scanProject worker, pure generation and explicit creation; no root-source mapping.
Coverage verification passed all 187 tests: parser/analyzer 100% lines/branches;
source extractor 100% lines / 97.83% branches; project scanning 93.20% lines;
creation/generation 100% lines. Focused feature tests (14) passed on Node 20.0.0,
22.13.0, 24.22.1 and 26.12.1 on macOS; final Windows-device output guards were
subsequently covered by the complete macOS suite. Real PTY confirmation accepted
and created only a synthetic temporary template. Final package dry-run has 29
explicit files; no configuration files/test fixtures/private source included.

The scanner's Node-20-compatible Babel 7.29.11 dependency is pinned; its three
transitive support packages are locked. npm audit --omit=dev reports zero known
advisories, not an independent security certification. Minimum runtime CI now
installs runtime dependencies before tests. All new hosted CI remains unexecuted.

Remaining limitations: direct static references only (no aliases/destructuring,
Vue SFC/Nuxt runtimeConfig or complete framework/control-flow semantics); conservative
file-wide process-shadow suppression; heuristic classification; fixed development
placeholders do not establish production validity. Root-level exclusive creation
prevents overwrite, including concurrent creators; portable Node APIs cannot protect
against hostile concurrent ancestor replacement. Windows ACLs and font appearance
need manual/native review. I/O failures may leave a partial newly created file.

No version bump, npm publication, tag, GitHub release, Git push, or external messages
were performed for this feature. Only public-source downloads and dependency/advisory
metadata lookups used network access. Source/configuration contents were never sent.
Recommended next step: review the local diff, then authorize hosted compatibility CI
before considering a future minor release. Human feedback remains uncollected.

Final review also corrected process-binding pattern handling: property keys and
right-hand default expressions are not declarations, while named class expressions
can bind process. The added regression brings the final suite to 187 passing tests.
No unresolved failing automated checks remain. New native Windows/Linux CI and
manual terminal/font checks remain pending, as stated above.

Final focused reruns passed all 15 feature tests on Node 20.0.0, 22.13.0,
24.22.1 and 26.12.1 (macOS), including the final binding and destination guards.
Final format check and package dry-run passed; archive remains 29 allowlisted files.

## Deep feature quality audit / premium CLI — Complete locally; release gates pending

2026-10-26, local only. Re-read AGENTS and discovery architecture/progress; reviewed
actual scanner, traversal, generator, creator, CLI, reporters and existing tests.
FEATURE_QUALITY_AUDIT.md records confirmed defects, severities, reproductions and
remedies. Four new scanner groups and three workflow/Git-ignore groups failed before
fixes; targeted reruns pass with lexical bindings, immutable aliases/destructuring,
constant template keys, wrapped fallbacks, key-preserving initialization, private-role
warnings and tracked-aware Git ignore checks. No publication/push is authorized.

### Deep quality audit — 2026-10-27, final verification underway

Re-read full AGENTS/spec and inspected the actual new modules. Confirmed regressions
in builtin imports, lexical scopes, aliases/destructuring, computed keys, TS-wrapped
fallbacks, template/local onboarding consistency, ignore roles/status and confirmation
failure paths. Added failing-before/fixed-after regressions, plus TS enum/namespace
and parameter-default cases and platform-neutral reserved-name checks. No breaking
changes to published check/API/schema contracts; no new dependency was introduced.

21 initial targeted tests and the A–J actual CLI matrix passed. Four resource/partial
write groups and 12 renderer/reporter tests passed; later output-failure tests passed
as well. Six pinned public inventories cover 239 scanned files / 54 references, with
no unmatched named references against an independent TypeScript compiler AST method.
Re-downloaded all six archives; all 251 retained sources/components match byte-for-byte.
Vue components correctly make one repository incomplete and block initialization.
Current measurements and verdict are recorded in FEATURE_QUALITY_AUDIT.md.

Docker client exists but no daemon is reachable; no Linux execution claimed. Native
Windows/macOS-terminal/font checks remain distinct from simulated capability tests.
The task still forbids Git pushes, tags, publication and deployment; none performed.

### Deep quality audit — final local result, 2026-10-27

FEATURE_QUALITY_AUDIT.md records Q01–Q20: confirmed product defects, validation-helper
defects, UX findings and separately labeled hardening. Final follow-ups reproduce/fix
sample-template onboarding, custom-output guidance and raw-mode-denied confirmation.
Readline now uses ordinary line input, with setup/output errors, SIGINT, EOF and idle
timeouts handled safely. Native PTY decline/accept/create/check and 0600 assertions
passed in isolated synthetic directories. No real user configuration was modified.

| Requested phase                 | Status / evidence                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1 Complete implementation audit | Complete locally; findings and architectural tradeoffs recorded                                              |
| 2 Adversarial scanner tests     | Complete; real AST cases, scopes/aliases/destructuring and seeded mutations                                  |
| 3 Framework compatibility       | Supported source patterns tested; Vue/Svelte/Astro explicitly incomplete; full framework support not claimed |
| 4 Init security audit           | Complete locally; exclusive creation, permissions, ignore roles, confirmations and failure injection         |
| 5 A–J complete workflow tests   | Complete; ten isolated actual CLI scenarios plus sample/custom-path regressions                              |
| 6 Public repository validation  | Complete for six pinned source inventories; independent TS reference and source hash verification            |
| 7 Security/performance tests    | Complete locally; enforced resource limits and measured single-run timings/RSS                               |
| 8 Premium terminal redesign     | Complete; shared writer, restrained hierarchy, grouped source-first rows and next steps                      |
| 9 Scan/init/check UX            | Complete; documented safe previews, concise diagnostics and meaningful guidance                              |
| 10 Responsive terminals         | 40/60/80/120/160 columns tested; native Windows/Linux/manual font checks pending                             |
| 11 Accessibility                | Labels/ASCII, NO_COLOR, TERM=dumb, non-TTY/CI and line prompts tested                                        |
| 12 Automated quality gates      | Complete locally; unit, CLI, security, package, types, contracts and coverage                                |
| 13 Fix and reverify             | Complete; failing-before regressions and full passing reruns                                                 |
| 14 Documentation                | Complete; realistic examples, limits, current roadmap and historical-report clarification                    |
| 15 Final verification           | Local checks pass; native Windows/Linux exact-revision results remain pending                                |
| 16 Quality report               | Complete; NEEDS WORK for release, with explicit evidence and remaining gates                                 |

Final npm run check passed **227 runtime tests**, **seven independent contracts**,
installed TypeScript 5.0.4/7.0.2 NodeNext/Bundler positive/negative consumers, emitted
ESM/CommonJS dynamic imports, lint and formatting. Coverage rerun passed all 227 tests:
parser/analyzer 100% lines/branches, source extraction 100% lines/98.68% branches,
bindings 99.60%/97.46%, traversal 93.07%/92.81%, discovery CLI 96.98%/91.07%; all
three initialization modules have 100% line coverage (80–90% branches).
Final focused suites passed **40 tests each** on Node 20.0.0, 22.13.0, 24.22.1 and
26.12.1, on macOS. Actual installed archive/API/shim and privacy checks passed in npm test.

Six public inventories yielded 239 supported files / 54 named references; no unmatched
named records against the independent TypeScript method within its documented scope.
All 251 retained source/component files match freshly downloaded pinned archives.
One Vue inventory is intentionally incomplete, blocking init; five generate safe previews.
Single-run measurements and commits are in feature-quality-repositories.json; they are
not generalized benchmark or external-user feedback claims.

Outstanding: native Windows/Linux testing, native terminal/font/ACL review, and external
feedback (Pending — Requires Human Participation). Docker daemon is unavailable;
Git pushes are prohibited, so no hosted CI was triggered. Package version stays 1.1.1.
No npm publication, tags, GitHub release, deployment, staging of generated files or push.
Next milestone: native compatibility review of this exact local feature revision.

Final package dry-run passed: 32 allowlisted files, 62,146 packed / 209,061 unpacked
bytes; no environment files, test fixtures or downloaded source inventories. Synthetic
secret exclusion and exact installed content were also checked by the package test.
Final documentation formatting and git diff whitespace checks passed. These local
audit/progress records are excluded from the npm archive.

## Reference-led CLI layout — Implemented; visual acceptance pending

2026-10-27. Re-read AGENTS, current roadmap/progress and reporter/CLI/tests. Compared
every significant layout difference with the owner's picture before implementation;
the comparison and terminal-specific tradeoffs are in CLI_DESIGN_REVIEW.md.

Implemented shared cell-aware rows, aligned detail columns, separators, three distinct
Errors/Warnings/Information metric blocks and a cyan framed Next Steps panel with a
separate command background. All scan/init/check surfaces, creation success and
operational errors use the same components. Cards stack below 54 available cells;
very small widths use plain labels. Long names/statuses retain content and stack
when needed. Colors use ANSI 16-color foreground/background codes and existing
NO_COLOR/non-TTY/TERM=dumb/quiet policies. JSON and analysis/creation contracts remain
unchanged. No dependency or version change belongs to this visual task.

Actual visual verification: 13 real CLI processes ran in isolated synthetic projects
through POSIX PTYs. Captured byte streams were replayed unmodified in xterm.js 5.5.0
installed outside the repository. Browser screenshots are saved in
docs/screenshots/cli-reference with raw transcript hashes and screenshot hashes.
Native Terminal automation and sandbox listeners were denied; the owner started a
temporary localhost server serving only synthetic captures. All 13 screenshots were
saved and the owner was told the server could be stopped. No native Terminal.app or
Windows/Linux screenshot certification is claimed.

The gallery covers scan/init/check at 80 and 40 columns, clean checks, warning checks,
syntax plus informational skipped-comparison findings, operational missing-file errors,
empty scan/init/check results and an explicitly authorized disposable template creation.
The three principal images were shown inline for owner review. Visual acceptance is
pending; implementing or testing a design does not constitute owner acceptance.

Files changed for this refinement: src/reporters/{terminal,discovery}.js,
src/discovery/cli.js, tests in reference-layout.test.js and reference-ui.test.js,
related reporter/CLI assertions, README, CLI/source-discovery guides, CHANGELOG,
CLI_DESIGN_REVIEW.md, this progress record and screenshots. Added a POSIX maintainer
capture utility scripts/capture-cli-design.py; it uses only synthetic disposable
projects and refuses an existing capture directory. It is not part of npm runtime.

Initial targeted results: 20 renderer/CLI tests passed. Full npm run check subsequently
passed **235 runtime tests**, **seven independent contracts**, lint, formatting and
installed TypeScript 5.0.4/7.0.2 NodeNext/Bundler positive/negative consumers, emitted
ESM and CommonJS dynamic imports. One existing layout-specific assertion was updated
to preserve key/code association across the new aligned rows. The eight new tests
verify exact metrics, independent badge edges and body columns, widths
40/60/80/120/160, Unicode/text-presentation widths, monochrome structure, all important
states, unchanged files and byte-identical check/scan/init JSON. Full existing privacy,
resource, consent, no-overwrite and installed-package regressions passed.

Coverage, final package contents and supported-Node spot-check results follow below.
No publication, push, tag, release, deployment or real configuration changes performed.

### Final reference-layout verification

- npm run check: PASS — 235 tests, seven contracts, lint, installed TypeScript
  consumers and formatting. CLI tests include exact check/scan/init JSON equality.
- npm run test:coverage: PASS — all 235 tests; terminal reporter 100% lines /
  98.96% branches, discovery reporter 97.25% / 92.23%. Existing core coverage gates pass.
- Node 20.0.0, 22.13.0, 24.22.1 and 26.12.1: 20 focused layout/CLI tests passed
  per runtime on macOS. These are runtime checks, not native OS certification.
- npm pack --dry-run --ignore-scripts --json: PASS — 32 allowlisted files,
  66,490 packed / 232,649 unpacked bytes. No environment files, screenshot assets,
  captures or test fixtures are shipped. Actual installed-package/API/shim checks
  also passed as part of npm test.
- All 13 screenshots and original ANSI transcripts match their SHA-256 manifests;
  scan/init/check and representative narrow/error/success states were visually inspected.
- Final whitespace and documentation-format checks are recorded with the local logs
  under /private/tmp/configpilot-reference-final-*.log and pack.json.

Design status: **Ready for owner visual review — acceptance pending.** The screenshot
gallery and comparison document make the implementation reviewable. Native Windows /
Linux font/terminal appearance remains unverified and the earlier release gates remain.

## v1.2.0 release — In Progress

2026-10-27: owner explicitly authorized push, tag and publication of a new version with
updated documentation, superseding the earlier local-only restriction. Selected 1.2.0
as an additive minor; public registry preflight returned 404, while latest was 1.1.1.
Current main is protected. The new release branch starts at the current main tree and
preserves all feature/audit/design changes. No previous version/tag will be rewritten.

Updated package/lock metadata, README installation and scan/init/check quick start,
CLI/source syntax/API guides, security policy, changelog, trial instructions, release
notes and preparation plan. Historical receipts and audit measurements are retained.
Hosted compatibility and exact-archive gates remain mandatory. npm identity preflight
returned 401; a browser login will be needed after the concrete candidate is verified.
No publication, tag, push or external release has occurred in this release session yet.

### First hosted v1.2.0 PR run — Windows test-harness correction

Run 40460706980 passed the minimum-runtime and Linux jobs but failed on Windows
in the output-failure security test: the injected ESM preload used a bare Windows
drive path with `--import`, returning 1 before the CLI could run. Changed the preload
to `pathToFileURL(...).href`, matching the existing portable failure-injection tests.
The security assertions and expected operational exit 2 remain unchanged.
The complete hosted matrix must pass on the corrected revision before release.
