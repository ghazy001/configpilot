# Changelog

Release history for ConfigPilot. Verification evidence and release status are
recorded in the repository's development progress log.

## Unreleased

Changes below are **unreleased source changes**. Package version remains 0.1.0;
these changes require an owner-approved new version before registry distribution.

### Security and reliability

- Quarantine ambiguous quoted multiline boundaries before body fragments can become
  declaration names or duplicate findings. Conservative recovery can suppress later
  declarations; previously accepted ambiguous inputs may now report syntax errors.
- Bound each input to 2,048 declarations/invalid lines, labels to 4,096 UTF-16 code
  units, and emitted key/label metadata to 131,072 code units. Excess raises a safe
  RangeError or CLI INPUT_LIMIT_EXCEEDED (exit 2), without partial results.

### Contracts and verification

- Export JSON Schema 2020-12 as configpilot/schema.json for complete/skipped analysis
  and operational-error envelopes; document schema/API evolution policies.
- Add pinned development-only dotenv comparison and schema validation; retain zero
  runtime dependencies. Verify installed TypeScript 5.0.4 and 7.0.2 consumers.
- Enforce 90% core line/branch coverage and add isolated resource-budget probes.
- Correct release/support documentation and track remaining v1 validation gates.

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
