# CI and repository safeguards

This document describes ConfigPilot's repository automation. It is separate from
the dependency-free runtime package. See [TESTING.md](TESTING.md) for local commands
and the platform matrix, and [RELEASING.md](RELEASING.md) for candidate review.

## Required quality checks

[Quality](../.github/workflows/ci.yml) runs for every pull request, main push and
manual dispatch, without path filters. Linux, Windows and macOS each run Node
20.19.0, 22.13.0, 24.x and 26.x; Linux additionally tests the Node 20.0.0 minimum
without incompatible development tooling. Normal jobs run clean installation,
lint, runtime tests, installed TypeScript consumer checks, formatting and instrumented
coverage. Tests inspect the actual archive,
install it offline, and execute its public API and installed CLI.

The final **Quality gate** always runs after the matrix and minimum-runtime jobs.
It fails unless both dependencies succeeded, including when jobs fail, are cancelled,
or are skipped. This stable check name is the branch-protection requirement; changing
the matrix does not silently change the required check. Do not rename it without
updating protection and the release preflight together.

`main` should require a pull request, an up-to-date successful **Quality gate** from
the GitHub Actions app, resolved conversations and linear history. Force pushes
and branch deletion should be disabled, with protection enforced for administrators.
These settings live in GitHub, not the workflow file. The [progress log](PROGRESS.md)
records their actual read-back and verification status.

The repository currently has one maintainer. PRs require passing CI but zero
independent approving reviews, so the owner can maintain the project without an
unavailable second reviewer. The maintainer still reviews the diff and verification
before merging. Add independent required reviewers when maintainership expands.
This is separate from the explicit owner gate for candidate review.

## Permissions and untrusted contributions

- Repository-default workflow permissions are read-only; workflows cannot approve
  pull-request reviews. Quality jobs explicitly request only `contents: read`.
- Checkout does not persist credentials. No workflow uses `pull_request_target`,
  exposes repository secrets to fork PR code, or executes downloaded candidate code
  in a privileged publishing job. There is no publishing job.
- Actions are pinned to immutable 40-character commits. Repository policy requires
  SHA pins and allows only `actions/checkout`, `actions/setup-node` and
  `actions/upload-artifact`. Adding another action requires deliberate policy review.
- Release preflight requests `checks: read` to verify the exact commit's Quality
  gate. Its ephemeral GitHub token is scoped to that step; no npm token or OIDC
  publishing permission is used. The review job checks out no code.
- Jobs have timeouts. Obsolete Quality runs for the same branch/PR are cancelled.
  Candidate preparations serialize so a newer run does not replace a pending review.

GitHub administrators can change repository configuration. These safeguards do
not replace maintainer review, credential hygiene or explicit publication approval.

## Dependency updates

[Dependabot](../.github/dependabot.yml) checks npm development dependencies and
GitHub Actions weekly, Monday at 08:00 Africa/Tunis. Compatible npm minor/patch
development updates are grouped; major updates remain separate. Each ecosystem
has a five-open-PR limit. There is no automatic merge or automatic version release.

Dependency vulnerability alerts and automated security-fix PRs are enabled as
repository settings and verified in the progress log. Security updates may arrive
outside the weekly version-update schedule. PRs must pass the same required CI.
Review Node compatibility, dependency changes and immutable action references before
merging; do not introduce a runtime dependency or raise the runtime floor casually.

## Security reports

Private vulnerability reporting is enabled for the upstream repository. Use
[Security → Report a vulnerability](https://github.com/ghazy001/configpilot/security/advisories/new)
as described in [SECURITY.md](../SECURITY.md). The policy retains a contact-only
fallback for forks or unavailable reporting. Repository settings do not prove that
a human has received a notification; maintainers should verify their GitHub security
notification preferences. No test vulnerability report is submitted during setup.

## Maintain and audit the configuration

When a change modifies CI or safeguards:

1. Read the workflow diff and verify new action SHAs against their official repositories.
2. Run `npm run check` and relevant tests. Inspect real GitHub job results, not only YAML syntax.
3. Confirm Quality runs for the PR and the final merge/main commit; verify the gate reports the full matrix result.
4. Read back branch protection, required-check provider, Actions defaults/allowlist,
   security settings, and the release-review environment in GitHub.
5. Record actual results and limitations in [PROGRESS.md](PROGRESS.md).

Branch protection should be changed through an owner-reviewed maintenance decision,
not temporarily disabled to push around a failing check. Use a feature branch and
pull request after protection is enabled. Candidate workflow verification uses the
preparation-only mode; agents must not approve owner-review jobs on the owner's behalf.
