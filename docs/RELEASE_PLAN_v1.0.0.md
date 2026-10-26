# Approved v1.0.0 release plan

Owner authorization on 2026-10-26: “okay let's realse the new version v1.0.0”.
Scope: configpilot@1.0.0 on the public npm registry as ghazi001, reviewed public
source delivery to ghazy001/configpilot, v1.0.0 tag and GitHub release. This replaces
the previous publication hold for this version only. Existing 0.1.0 artifacts/tags
remain immutable. No credentials, OTPs or recovery codes belong in chat or Git.

External developer feedback has not been collected. The owner accepted it as
post-release work; do not claim trials, adoption or an independent security audit.
The technical basis is the full hosted OS/runtime matrix, regression/contract/type
tests, package installation checks, public-template corpus and maintainer review.

1. Finalize 1.0.0 metadata, ordinary installation examples, migration/release notes.
2. Run quality/coverage/resource checks and review the final diff.
3. Commit and obtain passing exact-source hosted CI; deliver via reviewed PR with
   required checks, preserving branch protection. Do not bypass approval environments.
4. Prepare the clean final source archive; inspect all 21 files, hashes, executable
   mode and no unintended data. Verify its offline consumer and API/CLI behavior.
5. Recheck npm identity, version availability and publishing security. Publish only
   that verified archive with explicit registry/access/latest and scripts disabled.
   Owner completes any browser/security-key challenge directly.
6. Verify registry version/integrity/tarball bytes, fresh ordinary consumer and global
   CLI installation, then create the immutable tag and GitHub release.
7. Retain source/archive/registry identity and actual outcomes in docs/releases/1.0.0.json
   and PROGRESS.md. A failed command is not a successful publication; check registry
   state before retrying. Do not overwrite or recreate an existing release tag.
