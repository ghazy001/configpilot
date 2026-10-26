# Security and API readiness review — 2026-10-26

Scope: implementation `6e827ae7af1cfa01c008084133dff531351adcc5`, unchanged shipped
bytes at documentation revision `f3c99164f9a3479d90908a00353a545d92451475`.
This is a maintainer engineering review, not an independent penetration test or
security certification. Keep this review and regression details private until the
owner's disclosure decision permits sharing.

## Assessment

No additional confirmed release-blocking defect was identified in this review.
The previously confirmed quote-boundary, whitespace-prefix, resource-amplification
and source-identity findings have implemented regressions. The API is suitable for
a proposed v1 freeze with the documented limitations below. Final release readiness
still depends on hosted compatibility results, human trials, review of any subsequent
changes and explicit publication approval. Do not interpret this as an npm release gate passing.

## Reviewed boundaries and evidence

| Boundary              | Inspection and evidence                                                                                                                                                                   | Residual limitation                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Input and privacy     | Reviewed parser boundary scanning/quarantine, budgets and fixed diagnostic factory; synthetic API, CLI, installed-package and cross-loader contract regressions pass                      | Documented dotenv subset only; names/labels are public metadata, not secret-scanned                                   |
| File access           | Reader uses read-only open, regular-file checks before/after open, bounded reads, fatal UTF-8 decoding and finally-close; failure-injection tests cover races and short/interrupted reads | Selected symlinks are followed; concurrent file changes are not an atomic snapshot                                    |
| Execution and network | Inspected every runtime module and CLI entry point; no environment evaluation, child process, network request, configuration write or dynamic project-code loading                        | Hostile code already running in the caller's process is outside the boundary                                          |
| Output                | Only keys/locations/fixed text/counts reach reporters; terminal labels escape controls; native errors are replaced by fixed operational envelopes                                         | Reports may reveal intentionally public names/paths; users must review before sharing                                 |
| Resource handling     | Source, record, label and metadata budgets; controlled RangeError/API and exit 2/CLI; prior isolated resource probes passed                                                               | Limits intentionally reject some inputs accepted by public 0.1.0; release notes must retain this compatibility change |
| Distribution          | Explicit 21-file allowlist; no runtime dependencies/lifecycle scripts; verifier compares committed, checkout and installed bytes and archive digests                                      | Validation text still says 0.1.0; never publish changed bytes under that existing version                             |
| Release controls      | Reviewed preparation-only workflow, read permissions, source binding and exact-commit quality check; no publish command in workflows                                                      | Manual release still requires reviewed final version/artifact; preparation is not authorization                       |

## Proposed API freeze

- Runtime exports: synchronous `parseDotenv`, `analyzeConfig`, frozen `ISSUE_CODES`;
  schema subpath `configpilot/schema.json`. Internal modules/reporters stay private.
- ESM on Node 20+; CommonJS dynamic import supported, no synchronous CJS promise.
- Explicit string inputs; unknown options ignored; no implicit process.env merge.
  Syntax problems return findings; invalid types throw TypeError; budgets throw
  RangeError. Results are fresh mutable objects, with no shared analysis state.
- Six analysis codes, current severities and deterministic ordering; missing keys
  remain warnings because external provisioning is possible. Syntax errors skip
  differences and use null counts. Human prose may improve; consumers use codes.
- Schema 1 keeps its closed fields, nullability and semantics. Structural/schema
  changes require explicit compatibility review; breaking stable changes require
  a major package version. Summary arithmetic is tested separately from JSON Schema.
- CLI exits remain 0 clean/help/version, 1 findings, 2 operational failure.
  Empty values count as declarations; values are not validated or compared.
- Supported grammar, conservative recovery, limits, output streams and Node support
  policy remain documented contracts. No strict flag, multiline expansion, policy
  engine or source-analysis feature is needed to freeze this scope.

The runtime exports, declaration unions, schema and documented behavior were compared
directly. Strict installed consumers on TypeScript 5.0.4 and 7.0.2 cover NodeNext and
Bundler, negative cases, emitted ESM and CommonJS dynamic import. No new API-breaking
change is proposed by this review.

## Fresh verification

- `npm run check` on macOS ARM64 / Node 20.20.0 passed: 165 runtime tests,
  7 contract tests, zero failures/skips, lint, installed type consumers and format.
- npm 11.21.1 advisory audit completed successfully: zero known vulnerabilities
  across the lockfile's runtime/development graph. This is a dated advisory check,
  not proof that dependencies have no undiscovered vulnerabilities.
- Offline `candidate:verify` passed again for SHA-256
  `8cdcc32c6d8c33bd48d7cef05e042884f94601f90b20a7c94a5bdc97b98c8483`.
  All 21 files, source identity, imports/schema, installed shim and CLI checks matched.
- Earlier current-source macOS/Linux matrix, coverage and resource results remain
  recorded in PROGRESS.md. Windows results must be recorded only after actual execution.

External developer feedback: **Pending — Requires Human Participation**.
The owner will recruit consenting participants and distribute the private trial kit.
No developer results, independent approval or Windows success is inferred here.

Subsequent compatibility evidence: private hosted run **40305989425** passed all
12 matrix jobs, minimum-runtime tests and the final quality gate at f3c9916.
Windows logs show 163 passed / 2 documented POSIX-only skips out of 165 runtime
tests per job, 7 passing contracts and 100% core coverage. This closes the hosted
compatibility gate for the reviewed source; human participation remains pending.
