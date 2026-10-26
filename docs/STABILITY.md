# Stable v1.0.0 readiness

The owner approved implementing necessary stability work after the 2026-10-26
audit. Version remains 0.1.0 while work is reviewed; current changes are unreleased.
No npm publication/staging, new tag or external release is authorized by this document.

## Audit backlog

| Finding                                | Status              | Evidence / remaining gate                                                                                               |
| -------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| CP-001 quote-boundary privacy          | Implemented locally | Quarantine ambiguous interpretations; parser/analyzer/actual CLI regressions and pinned reference mutations             |
| CP-002 resource amplification          | Implemented locally | 2048 records, 4096-unit labels, 131072-unit metadata; safe RangeError/CLI exit 2; isolated probes                       |
| CP-003 inaccurate release/support docs | Updated             | Historical public 0.1.0 receipt; current source explicitly unreleased; GitHub release remains absent                    |
| CP-004 independent parser corpus       | Implemented         | Pinned dotenv 18.0.9 comparisons; intentional differences; no full compatibility claim                                  |
| CP-005 API/schema policy               | Implemented         | Shipped schema, negative mutations, documented SemVer/schema and prose policy                                           |
| CP-006 compiler/runtime policy         | Partially verified  | TypeScript 5.0.4/7.0.2 consumers; local Node 20/22/24/26 passed; new hosted OS matrix pending                           |
| CP-007 real-world validation           | Partially complete  | Six pinned templates passed; 3–5 real developer trials still pending                                                    |
| CP-008 release process                 | Prepared            | Durable old-release evidence, final checklist and active immutable-tag rules; new candidate/owner review still required |
| CP-009 finding policy controls         | Deferred, optional  | Warnings already fail CLI; no redundant strict flag or implicit process.env merge                                       |
| CP-010 OIDC/provenance/prereleases     | Deferred, optional  | Existing workflow remains preparation-only; future setup needs separate review                                          |
| CP-011 advanced integrations           | Post-v1             | No unrelated feature expansion                                                                                          |

## Required release gates

- [x] Current-source local quality, installed archive/consumer, coverage and resource checks recorded.
- [ ] Current-source full Linux/Windows/macOS and Node matrix passed; historical runs are not substitutes.
- [x] Six public templates pinned and evaluated without executing upstream code.
- [ ] 3–5 developer trials recorded; material feedback resolved and owner-reviewed.
- [ ] Security/compatibility review of final changes complete with no unresolved release blockers.
- [ ] Final API/schema/CLI freeze and supported-version policy approved.
- [ ] Unused package version selected by the owner; final source/archive manifest reviewed.
- [ ] Explicit owner approval for the exact publication/staging/tag/release scope.
- [ ] After approved publication, public installation and byte-integrity verification recorded.

## Decisions and tradeoffs

Keep the pure ESM API, six analysis codes, schema version 1 and CLI defaults/exit
policy. Quarantine uncertain quote boundaries rather than report possible credential
fragments. This can suppress later declarations; recovery is explicitly documented.
Resource limits now reject unusually dense inputs rather than silently truncate results.
These compatibility effects require release notes and an unused release version.
The schema export and INPUT_LIMIT_EXCEEDED operational code are unreleased additions.

Reference parser, schema validator and compiler aliases are pinned development-only
dependencies. The runtime remains dependency-free. Minimum Node runtime tests run
without dev tools; contract/type checks run in the installed development jobs.
Do not introduce a dual CJS build or full dotenv loading/interpolation without demand.

Manual owner-controlled 2FA publishing with exact reviewed archives is sufficient;
OIDC/provenance can strengthen the process but is optional for v1. Public-template
sampling is not developer feedback. Runtime compatibility with Node 20 does not
extend its upstream security support; recommend maintained runtimes for production.

## Delivery and disclosure

SECURITY.md requires vulnerability details/reproductions to stay out of public
issues, PRs and CI logs. Keep this security patch local for owner review until
coordinated disclosure/public delivery is approved. Do not publicly push a regression
reproduction just to obtain hosted CI. Local test evidence is useful but cannot
claim Windows/Linux verification of new code; run the matrix after the owner agrees
to public delivery or provides an appropriate private review/CI route.
