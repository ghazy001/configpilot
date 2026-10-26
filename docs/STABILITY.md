# Stable v1.0.0 readiness

The owner approved v1.0.0 release on 2026-10-26 after accepting missing human
feedback as a post-release uncertainty. Technical contracts are frozen for v1;
v1.0.0 publication and registry verification are complete. See
[the immutable release receipt](releases/1.0.0.json) and PROGRESS.md.

## Audit backlog

| Finding                                | Status             | Evidence / remaining gate                                                                                                         |
| -------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| CP-001 quote-boundary privacy          | Released in v1.0.0 | Quarantine ambiguous quotes; API/actual CLI/installed archive regressions and reference mutations                                 |
| CP-002 resource amplification          | Released in v1.0.0 | 2048 records, 4096-unit labels, 131072-unit metadata; safe RangeError/CLI exit 2; isolated probes                                 |
| CP-003 inaccurate release/support docs | Updated            | Immutable 0.1.0 history retained; v1.0.0 npm/tag/GitHub release verified                                                          |
| CP-004 independent parser corpus       | Implemented        | Pinned dotenv 18.0.9 comparisons; intentional differences; no full compatibility claim                                            |
| CP-005 API/schema policy               | Implemented        | Shipped schema, negative mutations, documented SemVer/schema and prose policy                                                     |
| CP-006 compiler/runtime policy         | Verified           | TypeScript 5/7 and full private hosted Windows/Linux/macOS matrix passed at f3c9916; see PROGRESS.md                              |
| CP-007 real-world validation           | Partially complete | Six pinned templates passed; Human feedback pending; accepted post-release follow-up                                              |
| CP-008 release process                 | Complete           | Owner-approved v1.0.0 completed with exact-archive verification and immutable tag; receipt retained                               |
| CP-009 finding policy controls         | Deferred, optional | Warnings already fail CLI; no redundant strict flag or implicit process.env merge                                                 |
| CP-010 OIDC/provenance/prereleases     | Deferred, optional | Existing workflow remains preparation-only; future setup needs separate review                                                    |
| CP-011 advanced integrations           | Post-v1            | No unrelated feature expansion                                                                                                    |
| CP-012 whitespace-prefix privacy       | Released in v1.0.0 | Unsupported whitespace before quoted values is rejected/quarantined; 2,835 cross-loader cases plus actual CLI/archive regressions |
| CP-013 candidate/source binding        | Released in v1.0.0 | Preparation and acceptance compare committed blobs directly; hidden index edits and rehashed changed archives fail                |

## Required release gates

- [x] Current-source local quality, committed 21-file candidate/consumer, coverage and resource checks recorded.
- [x] Private Linux ARM64 / Node 24 full checks, coverage, resources and exact-archive acceptance passed.
- [x] Remaining private Linux ARM64 Node 20.19.0/22.13.0/26.12.1 quality, coverage and archive checks; Node 20.0.0 runtime/archive checks passed.
- [x] Current-source hosted Windows/Linux/macOS matrix, minimum runtime and final quality gate passed privately at f3c9916 (run 40305989425).
- [x] Six public templates pinned and evaluated without executing upstream code.
- [ ] Post-release developer trials: **Pending — Requires Human Participation**. Use the published v1.1.1 trial instructions; feedback remains uncollected.
- [x] Maintainer security/API review of current implementation complete; no additional confirmed blockers found. See SECURITY_API_REVIEW.md; re-review any later changes.
- [x] Current API/schema/CLI and support policy frozen for the owner-approved v1.0.0 scope.
- [x] Owner selected unused version 1.0.0; final archive verification is tracked in PROGRESS.md.
- [x] Explicit owner approval to release v1.0.0; no later version is authorized.
- [x] v1.0.0 public installation, registry byte equality, tag and GitHub release verified.

## Decisions and tradeoffs

Keep the pure ESM API, six analysis codes, schema version 1 and CLI defaults/exit
policy. Quarantine uncertain quote boundaries rather than report possible credential
fragments. This can suppress later declarations; recovery is explicitly documented.
Resource limits now reject unusually dense inputs rather than silently truncate results.
Nonportable whitespace before quoted values is rejected and quarantined rather
than widening the supported grammar or exposing potential credential-body names.
These compatibility effects require release notes and an unused release version.
The schema export and INPUT_LIMIT_EXCEEDED operational code are v1.0.0 additions.

Reference parser, schema validator and compiler aliases are pinned development-only
dependencies. The runtime remains dependency-free. Minimum Node runtime tests run
without dev tools; contract/type checks run in the installed development jobs.
Do not introduce a dual CJS build or full dotenv loading/interpolation without demand.

Manual owner-controlled 2FA publishing with exact reviewed archives is sufficient;
OIDC/provenance can strengthen the process but is optional for v1. Public-template
sampling is not developer feedback. Runtime compatibility with Node 20 does not
extend its upstream security support; recommend maintained runtimes for production.

## Delivery and disclosure

Private coordinated review and hosted testing are complete. The owner now approved
releasing v1.0.0, including its public source and release documentation. Future
vulnerability reports still follow SECURITY.md. No real configuration or credentials
are included in source, regression fixtures or release artifacts. The private trial
kit is historical; external feedback remains uncollected and will follow release.

## Historical private review material

Pre-release implementation: **6e827ae7af1cfa01c008084133dff531351adcc5**.
Replacement validation directory: /private/tmp/configpilot-stability-validation-6e827ae.
SHA-256: **8cdcc32c6d8c33bd48d7cef05e042884f94601f90b20a7c94a5bdc97b98c8483**.
Offline acceptance receipts passed for macOS ARM64 Node 20.0.0/20.20.0/24.22.1
and Linux ARM64 Node 20.0.0/20.19.0/22.13.0/24.22.1/26.12.1, all for these exact 21-file bytes. Linux ran in a
disposable nonroot container with networking disconnected. This is additional
platform evidence, not completion of the full hosted matrix or human trials.
Version text remains 0.1.0 for validation only; this archive must never be published.

Initial implementation commit: 83ba72694aa6a79fe9911bb1e305c6733ba1af5a.
Validation archive/manifest: /private/tmp/configpilot-stability-validation-83ba726.
Archive SHA-256: 454b38deb525c5e28b8ceb141420d1bbf5dffa07c18f81749b3d9e67de0bc9cc.
It retains the existing version text for local checks only and must not be published.
That historical validation archive predates the whitespace-recovery follow-up;
it is not evidence for the latest source. The progress log records current
verification, replacement candidate identity and the owner's disclosure decision.

## Post-release terminal experience

Version 1.1.0 ships the terminal redesign and display flags with unchanged public
API/schema semantics. Owner-approved publication, matching registry archive bytes,
fresh unauthenticated consumer checks and required hosted Windows/Linux/macOS CI
are verified. See [the release receipt](releases/1.1.0.json) and PROGRESS.md.
Manual font/terminal appearance checks and external developer feedback remain open.

## Documentation patch v1.1.1

The owner-approved v1.1.1 patch corrects the npm README and current installation
guides. Runtime code is unchanged from v1.1.0. Registry README metadata, matching
archive bytes, fresh installation and hosted CI are verified; see
[the release receipt](releases/1.1.1.json).
