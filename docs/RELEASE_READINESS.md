# v0.1.0 release readiness

Review date: **2026-10-26**. The package is **unreleased and private**. This is a
readiness record, not permission to publish, stage, tag or create an external release.

## Identity and metadata

- Repository: `ghazy001/configpilot`; intended npm owner selected by the owner:
  **`ghazi001`**. These identifiers differ intentionally.
- Explicit public-registry query for `configpilot` returned **E404**: no public
  package record was available at review time. This does not reserve the name,
  prove registration eligibility or establish ownership.
- The owner's terminal output confirms successful browser login and
  `npm whoami --registry=https://registry.npmjs.org` returning **ghazi001**.
  The owner explicitly confirmed **2FA enabled** on 2026-10-26. This supersedes
  the earlier ENEEDAUTH result. The owner also rechecked the name and received E404.
  These are owner-supplied confirmations, not an agent audit of account settings;
  actual package ownership remains unverified until an approved first publication.
- Name `configpilot`, version `0.1.0`, MIT license and verified GitHub repository,
  homepage and issue links remain unchanged. No owner identity/email was invented.
- ESM entry `src/index.js`; `types` and the first export condition point to
  `src/index.d.ts`; default export target retains the existing ESM runtime entry.
  The CLI mapping and executable shebang remain unchanged.
- Node.js `>=20`, no runtime dependencies, no lifecycle scripts, exact file
  allowlist, `private: true`. No synchronous CommonJS entry point is promised.

## Technical verification

The checks below are required before accepting a candidate. Executed results and
immutable commit/workflow evidence are recorded in [PROGRESS.md](PROGRESS.md).

- Full lint, runtime/security/integration tests, formatting and coverage.
- Installed public package imports and actual CLI shims, exit codes and unchanged
  input files; offline installation from a tarball in a separate consumer project.
- Strict positive/negative TypeScript 7.0.2 checks against installed declarations
  with NodeNext and Bundler resolution, emitted ESM execution and CommonJS dynamic
  import. Counts narrow to numbers for complete reports and null for skipped ones.
- Real-checkout dry-run and complete archive inspection: **19 allowlisted files**,
  including the declaration file; no environment files, credentials, tests, tooling,
  lockfile, development dependencies or unreviewed assets. Installed bytes match.
- Linux, Windows and macOS development matrix plus Node 20.0.0 runtime verification.
- Clean committed candidate preparation with SHA-256/integrity/source manifest.
  Allowlisting does not identify credentials deliberately placed in allowed source;
  source/content review and synthetic leakage tests remain necessary.

## Remaining owner and release gates

1. Account authentication and owner-confirmed 2FA are recorded above. Recheck the
   account, 2FA and name eligibility immediately before
   any approved first publication; choose another name only by owner decision.
2. Confirm the final artifact and draft [release notes](RELEASE_NOTES_v0.1.0.md).
   Resolve the unfinished product-discovery/real-project validation risks recorded
   in progress before claiming the first release is proven useful in real projects.
3. Obtain explicit approval for a narrowly scoped change to the private guard and
   first publication/authentication plan. Existing preparation guards require private
   metadata, so any publisher/guard change must be reviewed and verified together.
4. After the package exists, verify actual npm ownership and configure a future
   least-privilege trusted publisher as described in [RELEASING.md](RELEASING.md).
   First-publication permission and later trusted-publisher permission are distinct.
5. Obtain separate authorization for tags, npm publication and GitHub release;
   verify public installation and update release documentation afterward.

All executable pre-publication checks and owner account confirmations are complete.
The roadmap's package-ownership task remains open until the name is registered
through a separately approved first publication; logging in does not establish
ownership. This confirmation does not authorize publication. Registry availability
and authentication are time-sensitive.
