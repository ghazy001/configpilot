# Project workflows improvement roadmap

Status: Complete — local implementation and verification after v1.2.0.
Native OS release validation remains pending; no new release is authorized.

1. Project rules and opt-in CI enforcement: bounded non-executable JSON, optional/
   external/required names, ignored source paths, configurable finding severities.
2. Required-value checks: shared dotenv parsing, no retained values, explicit rules
   only; preserve the default check report/schema and exit contract.
3. Template maintenance: read-only preview of missing template entries; no writes.
4. Vue support: official SFC parser, bounded isolated parsing, accurate original
   locations, safe unsupported/preprocessor findings. No framework code executes.
5. Workspaces: explicit roots inside a monorepo; independent reports and settings,
   bounded aggregate work, no automatic traversal of untrusted package manifests.
6. Automation: schemas for discovery/initialization and opt-in GitHub annotations.

Architecture: keep the existing parser/analyzer report untouched by default. An
explicit --config selects a JSON policy; policy check reports have their own kind
and include the original analysis. Project rules are never imported as JavaScript.
CLI flags select workspaces; single-project commands retain their meaning. Init
creates a single root-level file within the explicitly chosen workspace; aggregate
workspace mode is read-only. Template previews return safe empty assignments only.

Verification: meaningful unit/integration/security tests per stage, installed
consumer/schema/type checks, complete quality/coverage/resource/pack checks. Local
runtime tests do not establish native Windows/Linux compatibility for this revision.
Record executed results in PROGRESS.md. No version bump, publish, tag or Git push.

## Verification outcome

All six implementation items are complete locally. Full quality passed 258 runtime
tests, nine contracts and installed TypeScript consumers. Coverage, minimum Node
20.0.0, targeted Node 22/24/26, resource budgets and six pinned public source-only
projects passed. Full evidence and supported limits: PROJECT_WORKFLOWS_VALIDATION.md.
New native Windows/Linux CI remains a pre-release gate; Docker's daemon was unavailable.
No version bump, Git push, release tag or npm publication occurred.

## v1.3.0 delivery authorized

Owner explicitly authorized pushing, tagging and publishing on 2026-10-27.
Local implementation evidence above is historical; fresh native OS CI and exact
committed archive acceptance are mandatory before publication.
