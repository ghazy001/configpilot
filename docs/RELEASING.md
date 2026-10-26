# Candidate preparation and release boundary

ConfigPilot is unreleased, with `0.1.0` development metadata and `private: true`.
Milestone 7 provides a repeatable **unpublished candidate** workflow, not publication.
Milestone 8 adds bundled declarations, installed TypeScript consumer verification,
and a [readiness review](RELEASE_READINESS.md) with [draft release notes](RELEASE_NOTES_v0.1.0.md).
The owner has confirmed npm authentication and 2FA; package ownership remains
unverified pending a first publication. Actual publication and
external releases require explicit owner approval in Milestone 9.

## Prepare a candidate on GitHub

1. Merge reviewed changes through a pull request with successful required Quality CI.
2. Wait for **Quality gate** on the exact `main` commit to succeed.
3. Open [Release preparation](https://github.com/ghazy001/configpilot/actions/workflows/release.yml),
   select `main`, and dispatch with **request_review = false** for a rehearsal.
4. Inspect the `configpilot-candidate-<commit>` artifact. Artifacts expire after
   seven days; archive approved evidence separately if a later release needs it.

The workflow checks out the immutable triggering SHA and refuses other branches
or forks. A read-only API preflight requires a completed, successful GitHub Actions
Quality gate for that exact SHA, rather than a successful check on an older commit.
An older successful attempt cannot override a newer failing or pending gate.
It repeats local lint/tests/formatting/coverage before preparing the archive.

The internal helper requires the private-package guard, explicit safe file paths,
regular tracked files, a clean checkout and a new output directory outside it.
It checks `npm pack --dry-run` and the actual archive's file list against the
allowlist, with scripts disabled and offline package operations. An existing output
directory is never overwritten or removed. Failed preparations remove only a new
directory created by that invocation.

The artifact contains the `.tgz` and `candidate.json`: schema version, source commit,
package name/version, private status, archive filename, SHA-256, npm integrity and
exact file list. Verify that the hash matches the downloaded tarball and review the
full archive and consumer behavior. A matching hash binds the manifest to that
archive; it is not a provenance attestation or an approval to publish.

`private: true` is an npm publication guard, not an artifact confidentiality setting.
People signed in to GitHub with repository read access can
[download workflow artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts).
Artifacts in this public repository must contain only reviewed distributable source
and documentation, never credentials or private configuration.

The workflow uploads only these explicit files, never a workspace directory,
environment files, logs, credentials or a cache. Ordinary package tests independently
verify the reviewed distribution list, installed bytes, import/CLI behavior and
packaged Markdown links. Uploaded archives are for review, not an external release.

## Request owner review

Dispatch with **request_review = true** only when the candidate is ready for human
review. The candidate is prepared first, then the `review` job waits for the
**release-review** environment. That environment is restricted to `main`, requires
`ghazy001` as reviewer and disables administrator bypass.

Self-review prevention is disabled deliberately: the sole owner may dispatch and
then explicitly approve a candidate. Enabling independent-review requirements now
would prevent the sole maintainer from using the workflow. Agents must never submit
that approval using the owner's credentials. Add another trusted reviewer and
reconsider this setting when the project has more maintainers.

After approval, the job records the commit/artifact in its summary. It executes no
checkout or artifact code and does not publish, tag or create a release. Candidate
approval is not a substitute for an explicit owner instruction authorizing a future
npm publication or GitHub release. The current workflows have no npm credential,
`id-token: write` or `contents: write` permission, or publishing/release command.

## Local rehearsal

From a **clean source checkout**, use a development-supported Node version and an
absolute path to a new directory outside the repository whose parent already exists:

```sh
npm run check
npm run release:prepare -- "/absolute/path/outside/configpilot-candidate"
```

This produces the same private archive and manifest, without uploading or requesting
review. It does not query GitHub; the GitHub workflow separately enforces exact-commit
CI. The command is source-repository tooling, excluded from the installed npm package.
Ignored local `.env` files are not copied or read and remain excluded by the package
allowlist. Never put real credentials in source files, README, license or metadata;
allowlisting cannot recognize secret values placed deliberately in allowed files.

If preparation fails, check the private guard, tracked file allowlist, clean Git
status, output-directory location/nonexistence, and offline npm availability. Native
error details are omitted. Resolve the cause rather than disabling a guard.

## Before publication becomes possible

Complete Milestone 8, confirm package ownership and secure authentication, review
the final artifact in an independent consumer, and obtain explicit owner approval.
Any future publisher must consume the reviewed immutable artifact, keep the owner
environment gate, and use least privilege. Adding publishing capability, changing
the private guard, creating release tags and external releases are separate decisions.
Do not add a tag-push or automatic release trigger as part of a maintenance update.

The [v0.1.0 approval plan](RELEASE_PLAN_v0.1.0.md) identifies the package, publisher,
public registry, tag, release notes and ordered post-approval checks. The current
private candidate cannot be published unchanged. No publication guard may be
weakened merely to run a rehearsal.

## npm identity and future authentication

The owner selected npm username **`ghazi001`**, distinct from GitHub **`ghazy001`**.
On 2026-10-26 the owner supplied successful browser-login output and `npm whoami`
returning **ghazi001**, then explicitly confirmed **2FA enabled**. Their repeat
registry query returned `E404` for `configpilot`. This supersedes the earlier
unauthenticated check, but establishes neither package ownership nor a reserved name.
Before a separately approved first publication, recheck the authenticated account,
2FA and exact name on the trusted machine. Never send an agent a token or OTP.
An unavailable name requires an explicit owner naming decision.

For subsequent automation, prefer npm OIDC trusted publishing on GitHub-hosted
runners. Current requirements are npm 11.5.1+ and Node 22.14.0+. Configure the exact
repository, workflow filename and protected environment; grant `id-token: write`
only to the eventual protected publisher job. npm configuration requires an existing
package, so it cannot establish ownership of this unpublished name. See the
[npm trusted-publishing guide](https://docs.npmjs.com/trusted-publishers/) and
[npm trust prerequisites](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

Prefer 2FA with token publishing disabled once trusted publishing works. Avoid
long-lived write tokens and release caches; retain the owner approval gate. Review
current npm requirements again when publication is actually authorized. The owner
performed their own browser login; the agent did not handle credentials or change
account settings. No trusted-publisher setup, staging, publishing or package-registry
mutation has been performed as part of readiness work.

See [CI.md](CI.md), [SECURITY.md](../SECURITY.md), [CHANGELOG.md](../CHANGELOG.md) and
[PROGRESS.md](PROGRESS.md) for settings, privacy boundaries, implemented changes and
actual verification results.
