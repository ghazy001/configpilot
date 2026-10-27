# Release readiness

Reviewed 2026-10-27. **v1.2.0 preparation is in progress.** The owner authorized
pushing, tagging and publishing the discovery/init workflow, terminal redesign and
matching documentation. Publication follows the gates in
[the release plan](RELEASE_PLAN_v1.2.0.md); no success is implied by this checklist.
See [release notes](RELEASE_NOTES_v1.2.0.md) for the new workflow and limitations.

The current package adds AST-based JavaScript/TypeScript discovery, exclusive
placeholder-file creation and four additive public APIs. Existing check reports,
JSON schema and exit codes remain compatible. It is ESM-only, Node >=20, MIT,
with one direct runtime dependency (pinned Babel parser) and 32 allowlisted files.
The archive includes discovery/API/CLI/security documentation and excludes fixtures,
real environment files and terminal-capture tooling.

Local runtime, contract, installed TypeScript, lint and formatting checks passed
for the versioned source. Hosted Windows/Linux/macOS validation, exact-main candidate
verification, npm browser authentication and registry installation remain release
gates. [PROGRESS.md](PROGRESS.md) records actual results as each completes.
The [feature audit](FEATURE_QUALITY_AUDIT.md) and
[design review](CLI_DESIGN_REVIEW.md) retain the pre-release evidence and screenshots.
External developer feedback remains **Pending — Requires Human Participation**;
it must not be represented as completed testing.

## Historical releases

v1.1.1 was published and verified from cf6b178 with hosted CI and fresh local/global
installs. Its immutable evidence is in [the receipt](releases/1.1.1.json).
That evidence does not validate the new discovery implementation. Earlier private
Windows/Linux/macOS CI and dependency-free archives in [STABILITY.md](STABILITY.md)
refer to the earlier check-only package.

## Published 0.1.0 evidence

At its initial publication, configpilot@0.1.0 was latest with maintainer
**ghazi001** (GitHub owner **ghazy001**). The public archive matches reviewed source
be996e1297b21e245ab44e1ac4368b15b0e9bdf7 byte-for-byte. Its exact 19 files,
SHA-256/integrity and fresh unauthenticated registry-consumer results are recorded in
[the durable receipt](releases/0.1.0.json). The existing annotated v0.1.0 tag resolves
to that source. A GitHub release was absent at the read-only check; no new release
or tag is created by this stability work. The npm page UI was not independently
verified; canonical registry metadata, tarball bytes and installations were verified.

Owner login and 2FA were confirmed during the first publication. No credential or
recovery code was collected. Initial local publication has no OIDC provenance.
The published archive does not include the current privacy/resource fixes.

## Mandatory release checks

Use [STABILITY.md](STABILITY.md) and [PROGRESS.md](PROGRESS.md) for executed
verification. Historical archives must never be republished as the new release.

For any subsequent release:

- Complete current-source lint, runtime/contract/type/coverage/resource/archive checks.
- Verify new code on the complete hosted OS/Node matrix; old CI is historical evidence.
- Retain six pinned public-template results; external developer trials remain an
  explicitly accepted post-release follow-up, not a completed validation claim.
- Review remaining false positives, compatibility decisions and privacy behavior.
- Freeze API/schema/CLI contracts, version/support policy and approved release notes.
- Select an unused version and review the final committed archive/manifest and full
  installed consumer, including executable shims and both TypeScript compilers.
- Obtain explicit owner approval for that exact version/artifact before publishing,
  staging, tagging or creating an external release. Recheck account/2FA/registry.
- Verify public registry bytes/installation afterward and record the release outcome.

Trusted publishing, provenance, multiline support and advanced integrations are
optional; approval and correct artifact identity are mandatory. Use maintained Node
releases for production while preserving the reviewed Node 20 compatibility floor.
