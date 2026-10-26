# Changelog

Implemented changes are recorded here. Entries under Unreleased are development
work, not an npm publication or GitHub release. The package version currently reads
`0.1.0`; no release date or tag has been assigned.

## Unreleased

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
- Exact package allowlist, private publication guard, MIT license, ESM metadata,
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

Future approved releases should add their actual version/date and document any
breaking API, schema, or CLI changes explicitly, including before v1.0.
