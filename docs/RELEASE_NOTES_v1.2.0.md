# ConfigPilot v1.2.0

Discover, configure and verify environment configuration in unfamiliar JavaScript
and TypeScript projects, with safe initialization and a consistent terminal interface.

## New workflow

```sh
npm install --global configpilot@1.2.0
cd your-project
configpilot scan
# If .env.example does not exist:
configpilot init --template
# If .env does not exist:
configpilot init
# Review .env and supply required values privately.
configpilot check
```

- `scan` discovers JS/TS/JSX/TSX references through AST parsing, including direct,
  optional, bracket, immutable-alias and static-destructuring patterns. It reports
  source locations, static-fallback presence, cautious purpose/sensitivity hints,
  selected configuration key comparison and unresolved dynamic lookups.
- `init` previews safe placeholders and creates one nonexistent root-level file only
  with confirmation or `--yes`. It supports `--template`, `--output`, `--path`,
  `--dry-run`, JSON and display controls. Existing files are never overwritten;
  private Git-ignore warnings, exclusive creation and restrictive permissions apply.
- `scanSource`, `scanProject`, `generateEnvTemplate` and explicit `createEnvFile`
  add reusable ESM APIs and TypeScript declarations. Pure generation never writes.
- All commands share three severity cards, aligned badges and diagnostic details,
  responsive layouts and a highlighted Next Steps panel, with ASCII/NO_COLOR support.

## Compatibility and security

Node.js 20+ and ESM remain supported. Existing `check`, analysis exports, diagnostic
codes, JSON schema and exit behavior remain compatible. Warnings still exit 1 in check.
Scan exits 0 complete, 1 incomplete and 2 operational failure; init exits 0 for
creation/preview/cancellation/no keys and 2 for failure. Each JSON kind stays separate.

No project code/config/plugins execute. Source snippets, actual values and fallback
literals never appear in reports or generated configuration. Source traversal,
worker memory/time, references, findings and output are bounded. Initialization
retains selected key names without copying values, defaults to No, and never edits
.gitignore or stages/commits/pushes generated files. Babel's parser is the only new
pinned runtime dependency; its support packages are lockfile-pinned.

A reference does not prove requiredness, a sensitive name does not prove a credential,
and an empty placeholder can pass key-presence checks. Value validity and deployment
readiness are not tested. Vue/Svelte/Astro components and unsupported syntax cause
explicit incomplete scans; initialization refuses incomplete discovery. Unknown
runtime/dynamic behavior is never evaluated. Review all generated files manually.

Documentation includes the complete source syntax/limits/API/JSON/exit contract,
onboarding guidance for .env.sample/custom paths, updated CLI examples, security
boundaries and a 13-image terminal gallery. Release verification and registry identity
are recorded in PROGRESS.md and the publication receipt after execution. External
human feedback remains pending; no invented acceptance or benchmark claims are made.

## Publication verification

Published 2026-10-27 from protected main 9523a0c after successful PR and exact-main
CI, including the complete native OS/Node matrix. The 32-file registry archive
matched the reviewed SHA-256/integrity. Fresh local/global installs and full workflow,
privacy, overwrite protection, public API and TypeScript consumers passed. npm latest
is 1.2.0; immutable tag and GitHub release are live. See [the receipt](releases/1.2.0.json).
