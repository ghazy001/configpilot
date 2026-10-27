# ConfigPilot v1.2.0 release plan

Owner authorization, 2026-10-27: “pushed, tagged, and published as new version don't
forgot to put new documentation with the new feature ofc”. This follows the supplied
reference-led CLI screenshots. It authorizes delivery of the reviewed discovery,
initialization, audit fixes, terminal layout and corresponding documentation.
The earlier task's no-push/no-publication restriction is superseded for this release.

Version selection: **1.2.0**, an additive minor release after 1.1.1. The registry
returned 404 for 1.2.0 during preflight. Existing package versions/tags stay immutable.
The public check API, report schema, issue codes and exit policy stay compatible.
No publication of a different future version is authorized by this plan.

## Delivery gates

1. Update package/lock versions and all current installation/workflow/API/security
   documentation. Preserve historical release receipts and audit findings.
2. Run local lint, runtime tests, contracts, installed TypeScript, coverage/resources
   and exact package-content checks. Review the full diff and synthetic-only captures.
3. Commit the release on codex/release-1-2-0, push and create a protected-main PR.
4. Require hosted Windows/Linux/macOS jobs, minimum Node 20.0.0 and the Quality gate.
   Repair genuine failures without weakening tests. Merge only after required checks pass.
5. Require successful Quality CI for the exact merged main commit. Prepare its clean
   32-file archive/manifest, inspect all bytes and verify installation/API/CLI offline.
6. Refresh npm login as ghazi001 if needed. The owner completes browser/2FA security
   challenges; no password, OTP, token or recovery code is requested in chat.
7. Publish only that verified archive to registry.npmjs.org with public/latest metadata.
   Compare registry bytes and integrity, verify latest and fresh local/global installs.
8. Create immutable annotated v1.2.0 at the verified source, push the tag, create the
   GitHub release using the approved feature notes, and retain a durable receipt.

The existing preparation workflow never publishes. Manual owner-controlled 2FA remains
the publication path; no OIDC provenance is claimed. External developer feedback remains
Pending — Requires Human Participation. Full Vue/Svelte/Astro parsing remains out of
scope and those inputs explicitly prevent complete discovery/init. Native font review
is distinct from automated OS compatibility CI. Do not fabricate either result.
