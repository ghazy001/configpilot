# Candidate preparation and releases

The owner explicitly approved configpilot@0.1.0, publication as ghazi001, the v0.1.0
Git tag and GitHub release on **2026-10-26**. The approved execution plan is in
[RELEASE_PLAN_v0.1.0.md](RELEASE_PLAN_v0.1.0.md); actual outcomes and immutable
source/archive identities are recorded in [PROGRESS.md](PROGRESS.md).
The initial npm publication and existing tag are verified in
[the historical receipt](releases/0.1.0.json). This approval does not extend to later
versions or package-name changes. Current source fixes remain unpublished; never
reuse the existing 0.1.0 version for changed bytes. See [STABILITY.md](STABILITY.md).

The package has explicit public-registry metadata. The GitHub workflow still only
prepares **unpublished candidates**; it cannot publish, tag or create releases.
Future publications and external releases require their own explicit owner approval.

## Prepare a candidate on GitHub

1. Merge reviewed changes through a PR with successful required Quality CI.
2. Wait for **Quality gate** on the exact main commit to succeed.
3. Open [Release preparation](https://github.com/ghazy001/configpilot/actions/workflows/release.yml),
   select main, and dispatch with **request_review = false** for a rehearsal.
4. Inspect the configpilot-candidate-commit artifact. It expires after seven days;
   retain approved release evidence separately when needed.

The workflow checks out the immutable triggering SHA and rejects other branches or
forks. Its read-only API preflight requires the latest completed successful GitHub
Actions Quality gate for that SHA. It repeats lint/tests/type checks/formatting and
coverage before packing. It then verifies that exact archive in a fresh offline
consumer before upload; a failed acceptance check blocks the artifact step.
Older successful attempts cannot override newer failures.

The helper accepts either private metadata or a stable numeric version with no
private field and exactly this publishConfig: registry https://registry.npmjs.org/,
access public, tag latest. Wrong registries, access, tags, prereleases and unexpected
publication options are rejected. A future prerelease channel needs deliberate
review rather than silently using latest. Neither metadata mode authorizes publishing.

Both modes require safe explicit file paths, regular tracked files, a clean checkout,
and a new output directory outside it. Every shipped file is compared directly with
its committed blob; local Git index flags cannot hide changed bytes. Scripts-disabled offline dry-run and actual
pack lists must exactly match the allowlist. Existing output directories are never
overwritten or removed; failures remove only the directory created by that invocation.

Artifacts contain the tgz, candidate.json and verification.json. The manifest contains schema version, source commit,
name/version, actual private status, explicit publication options for public candidates,
archive filename, SHA-256, npm integrity and exact file list. Inspect the entire
archive and independently install/import/execute it. Hash matching binds the manifest
to that archive; it is neither provenance nor approval to publish.
The value-free verification receipt identifies the same source/digest and actual
Node/OS/architecture; it does not replace the complete compatibility matrix or human review.

Artifacts in this public repository are downloadable by signed-in GitHub users
with repository read access. Private metadata does not make artifacts confidential.
Only reviewed distributable source/docs may be included; never credentials or private
configuration. The workflow uploads only the named archive, manifest and verification receipt, not the
workspace, environment files, logs, credentials or cache. See
[GitHub artifact access](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts).

## Optional owner candidate review

Dispatch request_review = true only to request human inspection. Preparation runs
first, then review waits for the release-review environment: main only, ghazy001 as
required reviewer, administrator bypass disabled. Self-review prevention is disabled
for the sole maintainer, who may dispatch and explicitly approve their own review.
Agents must never grant that environment approval using the owner's credentials.
Add another trusted reviewer and revisit this policy if maintainership expands.

After approval, that job records the commit/artifact without checking out code or
publishing. Candidate approval does not replace explicit release authorization.
Workflows retain read-only contents permissions, with checks: read only for preflight;
no npm credential, OIDC write permission or publishing/release command is configured.

## Local preparation and approved first publication

From a clean checkout, with a new absolute directory outside it:

```sh
npm run check
npm run release:prepare -- "/absolute/path/outside/configpilot-candidate"
npm run --silent candidate:verify -- "/absolute/path/outside/configpilot-candidate"
```

This prepares the same archive/manifest without upload or publication. Ignored
local environment files are neither read nor copied. Never place credentials in
allowed source/README/license/metadata: allowlisting cannot identify a credential
intentionally embedded in an allowed file. See [SECURITY.md](../SECURITY.md).

For the approved first release, use the owner's authenticated local npm account
**ghazi001**, distinct from GitHub **ghazy001**. The owner handles any browser/security-key
challenge directly; no OTP/token belongs in chat, Git, command arguments or logs.
Recheck account identity, 2FA, the exact name and final archive immediately before
publishing. An unavailable name requires an owner decision. Publish the reviewed
archive with scripts disabled and explicit registry/access/tag, then verify registry
integrity, maintainer and clean consumer installation before creating the release tag
and GitHub release. Local first publication does not carry GitHub OIDC provenance.

If preparation fails, fix metadata, tracked source, dirty checkout, destination or
npm availability; do not disable safety checks. If publication fails, inspect the
registry before retrying. Never upload changed bytes under an existing name/version.

## Future trusted publishing

After the package exists, configure a protected OIDC trusted publisher in a separate
reviewed workflow change. Current npm guidance requires npm 11.5.1+ and Node 22.14.0+;
match the exact repository/workflow/environment and retain human approval. Prefer
stage-only publishing if suitable and disable token publication once OIDC is verified.
Recheck current guidance when that setup is authorized. No such setup is silently
included in this first local release. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
and [npm trust prerequisites](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

See [CI.md](CI.md), [release readiness](RELEASE_READINESS.md), [release notes](RELEASE_NOTES_v0.1.0.md)
and [progress](PROGRESS.md) for repository policy, boundaries and actual evidence.

## Stable release review record

For every proposed new version retain: the clean source SHA, exact archive member
list and executable modes, SHA-256 and npm integrity, full quality results, pinned
public-template results, real trial feedback, compatibility decisions, release notes
and the owner's approval scope. Candidate manifests are evidence, not publication
permission. Reinstall the exact approved archive before publishing; after publication
compare the registry bytes and run a fresh unauthenticated consumer. Preserve the
record in docs/releases/ without credentials or configuration contents.

Release tags now have separate protection from main: active ruleset **25863373**,
Immutable release tags, blocks updates/deletions of refs/tags/v* with no bypass actors.
It was applied under the owner's authorization for necessary release hardening and
read back successfully. Its declarative configuration is in
[release-tag-ruleset.json](release-tag-ruleset.json). New tag creation remains available
for separately approved releases. Existing tags were preserved; no deletion/retagging
test was performed on a real release.
Manual 2FA release with these checks is acceptable; no automatic publisher is required.
