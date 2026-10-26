# Historical v0.1.0 first-release approval plan

Prepared and **explicitly approved by the owner on 2026-10-26**. The owner answered
“yes go ahead” to the exact request covering guard removal through reviewed checks,
configpilot@0.1.0 publication as ghazi001, the v0.1.0 tag and GitHub release.
This approval is limited to this first release. The workflow only prepares
unpublished candidates; execution and verified outcomes are recorded in PROGRESS.md.

The approved npm publication and existing tag are verified in
[the release receipt](releases/0.1.0.json). This historical plan does not authorize
changed bytes under 0.1.0 or a future version. Current gates are in [STABILITY.md](STABILITY.md).

## Proposed release identity

| Item                              | Proposed value                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| npm name/version                  | configpilot@0.1.0                                                                     |
| npm publisher                     | ghazi001; confirmed by read-only npm whoami                                           |
| Registry / visibility / dist-tag  | https://registry.npmjs.org / public / latest                                          |
| GitHub repository                 | ghazy001/configpilot                                                                  |
| Git tag / GitHub release          | v0.1.0 / ConfigPilot v0.1.0                                                           |
| Runtime / module format / license | Node.js >=20 / ESM, declarations included / MIT                                       |
| Release notes                     | [Reviewed draft](RELEASE_NOTES_v0.1.0.md), finalized with the actual publication date |

The latest name lookup returned E404; the name is not reserved. If another publisher
registers it or npm rejects registration, stop for an owner naming decision. Never
silently substitute another package name or publish from a different account.

## Verified review material

- Current private candidate and source manifest: see [PROGRESS.md](PROGRESS.md) for
  the exact commit, file list, hashes, test results and CI evidence.
- Exactly 19 distributable files; no runtime dependencies, environment files,
  credentials, development tooling or lifecycle hooks. Installed ESM imports,
  TypeScript consumers and CLI execution have been verified from actual archives.
- [Discovery review](DISCOVERY.md) and [three pinned public-template evaluations](REAL_PROJECT_EVALUATION.md).
  These provide initial compatibility evidence, not user adoption or endorsement.
- npm account ghazi001 is authenticated; the owner confirmed 2FA. No token or
  recovery code is requested. Public package ownership cannot be verified before
  the first approved publication.

## Approved execution sequence

1. Prepare a protected PR that removes private: true, adds explicit public-registry
   publication metadata, finalizes the first-release changelog/README/notes, and
   updates preparation guards and their tests together. Preserve explicit file
   allowlisting, clean tracked source, commit/hash binding and owner review.
2. Require the complete Quality gate for that PR and its merged main commit.
   Pack and inspect the final publishable archive; independently install/import/
   execute it and rerun the TypeScript consumer. The current private candidate
   **cannot** be published unchanged: its metadata deliberately blocks publication.
   Record the final archive hash and review all differences from this candidate.
3. Recheck npm whoami, 2FA, name availability and the reviewed source/artifact.
   For this first publication, use the owner's interactive local npm authentication
   with 2FA. The owner handles any security-key/browser challenge directly; never
   put an OTP/token on a command line, in chat, in Git or in workflow secrets.
4. Publish only the reviewed final archive with explicit registry, public access,
   latest tag and scripts disabled. Do not publish a checkout that may have changed.
   npm supports tarball publication; see [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/).
5. Verify registry name/version/maintainer and integrity, install configpilot@0.1.0
   from the public registry in a fresh consumer, and run the CLI/API/type examples.
   Then create the approved v0.1.0 tag on the release commit and GitHub release with
   the finalized notes. Do not tag or announce a publication that failed.
6. Record the actual publication URLs, dates, final artifact/source identity and
   public-consumer evidence. Complete Milestones 8/9 only when their remaining
   ownership/public-install checks really pass. Seek user feedback afterward.

An approved first local publication will not have GitHub OIDC provenance. Do not
claim that it does. npm name/version publication is effectively immutable; if a
published artifact is wrong, stop and review a new-version/remediation plan rather
than retrying a changed archive under 0.1.0.

## Subsequent automation is a separate setup

After the package exists, configure a protected npm trusted publisher for the exact
repository/workflow/environment, retain human approval and use least privilege.
Prefer staged OIDC publication for future versions if it fits the owner workflow.
That setup needs its own verified workflow change and npm-side configuration; it
is not silently enabled by this first-release approval. See the current
[npm trusted-publishing guide](https://docs.npmjs.com/trusted-publishers/) and
[existing safeguards](RELEASING.md).

The owner approval covers only the package/version/account above, guard removal
through reviewed checks, public npm publication, the v0.1.0 tag and GitHub release.
It does not authorize future releases, a new package name or silent changes to
the approved scope. [AGENTS.md](../AGENTS.md) still requires explicit approval.
