# Changelog

Release history for ConfigPilot. Verification evidence and release status are
recorded in the repository's development progress log.

## 1.2.0 — 2026-10-27

- Follow the CLI visual reference with three distinct severity cards, aligned status
  badges/detail columns, shared header dividers and a highlighted Next Steps panel
  across scan/init/check and operational errors. Stack the layout for narrow terminals.
- Capture 13 real synthetic CLI PTY states for terminal-emulator screenshots and add
  exact-count/alignment, monochrome, state and unchanged-JSON regression tests.
- Deep-audit fixes: lexical process/import/alias/destructuring analysis, constant
  template keys, wrapped defaults, UTF-8 budgets and explicit unsupported components.
- Preserve selected template/local keys during initialization without copying values;
  harden private filename roles, tracked-file ignore warnings and confirmation failure handling.
- Premium scan/init/check presentation with source locations, concise groups, safe
  previews, context-sensitive next steps and responsive 40–160-column coverage.
- Correct sample-template onboarding and custom-file check guidance without changing
  the established `.env.example` / `.env` check defaults.
- Add adversarial workflow, seeded privacy, partial-write and resource regressions,
  plus independent TypeScript AST comparisons across six pinned public repositories.

- Add AST-based JS/TS/JSX/TSX source discovery with deterministic classifications,
  selected configuration comparison, bounded workers and separate JSON reports.
- Add consent-based initialization, pure placeholder generation and exclusive
  root-level creation with Git-ignore warnings, no overwrite and restrictive modes.
- Add scanSource, scanProject, generateEnvTemplate and explicit createEnvFile APIs
  with TypeScript declarations. Existing check contracts remain unchanged.
- Add pinned @babel/parser runtime dependency; parser/analyzer behavior is preserved.

## 1.1.1 — 2026-10-26

- Correct current installation commands, archive examples, trial instructions and
  release summaries after v1.1.0; ordinary installation commands select latest.

## 1.1.0 — 2026-10-26

- Redesign terminal reports with compact branding, selected paths, stacked findings,
  friendly titles, safe actions, accurate success states, and responsive wrapping.
- Add stream-aware colors, Unicode/ASCII fallbacks, `--no-color`, `--quiet`, and
  `--verbose`; keep all diagnostic codes, severities, exit codes, and JSON unchanged.
- Preserve value privacy and escaped labels without adding runtime dependencies.

## 1.0.0 — 2026-10-26

Stable API and CLI contracts for the documented dotenv subset. External developer
feedback has not yet been collected; no adoption or user-validation claim is made.

### Migration from 0.1.0

Public function signatures, six diagnostic codes, schema version 1 and CLI exits
remain unchanged. New resource limits can throw RangeError / return exit 2, and
ambiguous or nonportable quoted syntax can now produce parser errors. Review those
findings before relying on key differences. The schema subpath is a new export.

### Security and reliability

- Quarantine ambiguous quoted multiline boundaries before body fragments can become
  declaration names or duplicate findings. Conservative recovery can suppress later
  declarations; previously accepted ambiguous inputs may now report syntax errors.
- Reject nonportable whitespace before quoted values and quarantine their bodies.
  Previously accepted prefixes now report INVALID_DECLARATION; ordinary spaces/tabs
  and unquoted opaque Unicode values preserve their behavior.
- Bound each input to 2,048 declarations/invalid lines, labels to 4,096 UTF-16 code
  units, and emitted key/label metadata to 131,072 code units. Excess raises a safe
  RangeError or CLI INPUT_LIMIT_EXCEEDED (exit 2), without partial results.

### Contracts and verification

- Export JSON Schema 2020-12 as configpilot/schema.json for complete/skipped analysis
  and operational-error envelopes; document schema/API evolution policies.
- Add pinned development-only dotenv comparison and schema validation; retain zero
  runtime dependencies. Verify installed TypeScript 5.0.4 and 7.0.2 consumers.
- Enforce 90% core line/branch coverage and add isolated resource-budget probes.
- Verify the full Windows/Linux/macOS Node 20/22/24/26 matrix and document support boundaries.
- Simplify ordinary npm installation commands; testing-only flags are not required.
- Add offline candidate acceptance with archive/source identity, installed byte
  equality and real API/CLI workflows for private cross-platform review.
- Bind candidate source to committed blobs even when Git index flags hide edits
  from status/diff; mismatched local source cannot produce a verified candidate.

## 0.1.0 — 2026-10-26

### Added

- Pure `parseDotenv` API for the documented single-line dotenv subset, returning
  names/locations, duplicate findings, safe syntax errors, and multiline quarantine.
- Pure `analyzeConfig` API with deterministic missing/undocumented-key comparison,
  six stable diagnostic codes, specific recommendations, and report schema version 1.
- `configpilot check` with default/explicit paths, terminal/JSON output, help/version,
  documented 0/1/2 exit statuses, strict arguments, bounded UTF-8 regular-file reads,
  and safe operational errors.
- Unit, generated, process-isolation, privacy, I/O-fault, archive, and offline consumer
  tests; coverage reporting and a pinned, read-only Linux/Windows/macOS quality matrix.
- Quick start and verified terminal example; CLI/parser/report/testing contracts;
  troubleshooting, contribution and security policies, code of conduct, runnable
  examples, and development progress tracking.
- Exact package allowlist, explicit public-registry metadata, MIT license, ESM metadata,
  lint/format tooling, and cross-platform LF text policy.
- Stable required Quality gate, weekly npm/Actions dependency updates, restricted
  SHA-pinned Actions policy, private vulnerability reporting and owner-reviewed
  unpublished candidate preparation with commit/hash manifests. No publishing step.
- Bundled TypeScript declarations for all public exports and report/diagnostic
  types; report-state and issue-code narrowing; offline installed-consumer positive
  and negative checks with NodeNext and Bundler resolution, emitted ESM execution,
  and CommonJS dynamic-import verification. TypeScript is development-only.

### Compatibility and limits

- Node.js 20+ runtime; ESM exports `parseDotenv`, `analyzeConfig`, and `ISSUE_CODES`.
  Bundled declarations are verified with TypeScript 7.0.2. No synchronous CommonJS
  entry point is provided; CommonJS consumers can use asynchronous dynamic import.
- Empty values count as declarations. Missing and undocumented keys are warnings;
  they do not establish whether a deployment is broken. CLI warnings still exit 1.
- Parser errors skip all differences; unavailable counts are `null`. Physical
  multiline values, runtime interpolation, source reference analysis, multi-environment
  matrices, severity policies, and automatic rewriting are not implemented.
- No assignment values or raw invalid source lines in reports. Names and file
  labels are public metadata. Full dotenv compatibility is not claimed.

Future releases must document breaking API, schema or CLI changes explicitly,
including before v1.0. Publication always requires owner approval.
