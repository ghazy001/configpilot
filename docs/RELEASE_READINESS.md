# Release readiness

Reviewed 2026-10-26. **v1.1.0 published and verified.** The exact release source
4aaa83f passed hosted CI; registry bytes, ordinary local/global installs and public
API/CLI behavior were verified. npm latest, the immutable tag and GitHub release
identify 1.1.0. See [the release receipt](releases/1.1.0.json).
External feedback is explicitly accepted post-release work, not a completed claim.
The old 0.1.0 validation archives are historical and must never be published.

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

## Technical evidence and future release checks

Use [STABILITY.md](STABILITY.md) and [PROGRESS.md](PROGRESS.md) for current work and
executed verification. The source adds bounded records/metadata, quote quarantine,
JSON Schema and TypeScript 5.0.4/7.0.2 checks. It remains ESM-only, Node >=20, MIT,
with zero runtime dependencies. The distribution now has 21 explicit files.

Private validation now includes a Linux ARM64 container running Node 24.22.1:
full quality/installed TypeScript checks, coverage/resources and offline acceptance
of the exact macOS-prepared archive passed with networking disconnected. macOS
Node 20/22/24/26 checks and minimum Node 20.0.0 runtime tests also passed.
Additional private Linux ARM64 checks passed on Node 20.19.0/22.13.0/26.12.1
(quality, coverage and exact-archive acceptance) and 20.0.0 (runtime and archive).
The complete hosted Windows/Linux/macOS matrix subsequently passed privately at
f3c9916 in run 40305989425. The maintainer security/API review found no additional
confirmed blocker. External feedback is **Pending — Requires Human Participation**.
The current archive identity is in [STABILITY.md](STABILITY.md).

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
