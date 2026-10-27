# Project workflows validation — 2026-10-27

Historical local audit, recorded before v1.3.0 release authorization. Current delivery
status is in PROGRESS.md; the measurements below retain their original source identity.

Verdict: **Complete for local implementation/review; not authorized for release.**
All six requested improvements are implemented. Package version remains 1.2.0;
these working-source additions are unreleased. No push, tag, publish or deployment.

## Implemented scope

| Improvement              | Implementation and boundary                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project rules/CI         | Explicit bounded JSON, optional/external/required keys, bounded glob subset, severity/failure policy; syntax/incomplete failures stay protected.      |
| Unfinished configuration | Explicit required-local blank checks through the existing quote-quarantining parser; no values retained or evaluated.                                 |
| Template updates         | Sorted empty-assignment preview; no patch application, credential copying or overwrites.                                                              |
| Vue                      | Official pinned SFC parser in isolated workers; inline JS/TS/JSX/TSX script blocks; unresolved templates and unsupported block combinations explicit. |
| Workspaces               | Explicit nonoverlapping contained roots, independent reports, shared scan budgets; creation only for a single selected root.                          |
| Automation               | Four new exported schemas, safe opt-in GitHub annotations, two additive pure APIs and installed TypeScript tests.                                     |

The original parser/analyzer report and check schema, ISSUE_CODES, default commands
and exit contract remain compatible. Opt-in policy check wraps the original analysis
instead of modifying its schema. Source extraction stays separate from comparison,
policy evaluation, file creation and terminal/JSON/annotation presentation.

## Executed quality gates

- `npm run check`: **258/258 runtime tests, 9/9 contracts**, installed TypeScript
  5.0.4/7.0.2 strict positive/negative NodeNext/Bundler checks, emitted ESM and CommonJS
  dynamic import, lint and formatting passed.
- `npm run test:coverage`: **258 passed**; 98.96% aggregate lines. Parser/analyzer and
  pure policy evaluator each 100% lines/branches; rules 100% lines, 98.13% branches;
  Vue wrapper 96.74% lines, 84.85% branches. Coverage includes direct Vue tests as
  well as real worker/CLI integration, not snapshots alone.
- Node **20.0.0 minimum**: full **258/258 runtime tests passed** on macOS ARM64.
- Node **22.13.0 / 24.22.1 / 26.12.1**: each passed all **20** new workflow/display
  tests on macOS ARM64. This is runtime-version coverage, not native OS coverage.
- Five isolated resource-budget scenarios passed on Node 20.20.0/macOS; measured
  peak RSS 59.25–114.89 MiB and elapsed 10.07–141.99 ms for those synthetic analyzer
  scenarios. These are budget probes, not general scanner performance claims.
- Runtime dependency audit returned **zero known vulnerabilities** for the installed
  graph (two pinned direct dependencies; 17 dependency packages). The official Vue
  parser added 13 packages. Its correctness benefit is reliable SFC boundaries;
  it is loaded only for Vue inside bounded parser workers.
- Actual package tests inspect an exact 45-file allowlist, plant synthetic .env
  files, install offline into a separate consumer and execute installed CLI/API,
  including Vue workers, new pure APIs and exported schemas. Package dry-run and
  final formatting/whitespace inspection are recorded in PROGRESS.md.

One heavily oversubscribed coverage run hit the unchanged two-second worker budget
while multiple complete test suites ran concurrently. The parser failed closed;
no guessed keys were returned. Isolated/sequential coverage reruns passed. Runtime
budgets were not relaxed, tests were not skipped to obtain success, and the failed
run is not counted as successful verification. Future CI should run quality/coverage
sequentially as the existing workflow does.

## Regression evidence and review fixes

- Canonicalize the project base before producing workspace/GitHub paths; path aliases
  no longer yield host-relative traversal labels or omitted valid annotations.
- Reject explicit null/unknown project fields instead of silently treating them as
  defaults; JSON/code contracts agree on field types.
- Bound template preview bytes and permit inventories above the smaller policy-key
  list limit; long-name previews fail safely instead of amplifying output.
- Prioritize errors before annotation/display caps, so informational findings cannot
  hide more important findings in another workspace.
- Policy success no longer claims key sets match when a finding was intentionally
  suppressed. Operational workspace failures count as errors. Empty previews do not
  imply that a nonexistent template is up to date.
- External/optional rules affect local presence only; template documentation and
  public-secret guidance remain visible. A failing-before renderer regression passes.
- A deterministic temporary-file regression reproduced a symlink replacement between
  configured path selection and reading in the unreleased wrapper. No-follow reads
  now reject it; the failing-before test returned 1, and the corrected test exits 2
  without reporting the outside key. Legacy explicit symlink behavior is unchanged.
- Defense in depth: reject cross-drive absolute relative-path results and discard
  worker stdout/stderr; parser-library warnings cannot become raw source previews.
  No third-party snippet leak was observed or claimed as a confirmed vulnerability.

## Public source-only validation

Cached pinned source-only snapshots from the earlier audit were scanned in separate
processes; no upstream application code, build, plugins or dependencies were executed
or installed. `init --dry-run --json` created nothing. All cached source bytes were
compared before/after. These are one-run local measurements on Node 20.20.0/macOS,
not performance promises or exhaustive false-positive/negative results.

| Repository                                           | Pinned commit prefix | Files | References | Scan ms | Peak RSS MiB | Init preview |
| ---------------------------------------------------- | -------------------- | ----- | ---------- | ------- | ------------ | ------------ |
| heroku/node-js-getting-started                       | 8b8dec11fcf0         | 2     | 2          | 109.31  | 67.27        | preview      |
| expressjs/express                                    | 1c6f1b0fe400         | 142   | 15         | 413.5   | 106.3        | preview      |
| fastify/demo                                         | 895908e4e706         | 46    | 32         | 198.61  | 78.77        | preview      |
| vercel/nextjs-postgres-nextauth-tailwindcss-template | fe026711c19a         | 33    | 1          | 176.48  | 77.48        | preview      |
| antfu/vitesse-lite                                   | 0b352977755e         | 15    | 1          | 260.74  | 80.38        | no-variables |
| nestjs/typescript-starter                            | 0b6d71261ba3         | 8     | 3          | 107.18  | 67.98        | preview      |

All six scans completed. The Vue/Vite snapshot produced five explicit unresolved
Vue-template notices. Its only named key is framework-provided, so no configurable
placeholder was invented. Synthetic SFC fixtures separately verify actual environment
references, shadowing, comments, strings, original CRLF locations and all supported
script languages. Full commits/measurements and the local source fingerprint are in
[the machine-readable record](project-workflow-validation.json).

## Remaining release gates and limitations

- New native Windows/Linux CI has **not run** for this revision. Docker is installed
  locally but its daemon was unavailable. Historical v1.2.0 CI does not validate this
  new source. Run the protected OS/Node matrix after separately authorized delivery.
- Vue template expressions are unresolved; dual script blocks, external src and
  unsupported preprocessors make scans incomplete. Svelte/Astro and Nuxt runtime-config
  semantics remain unsupported; no complete framework compatibility is claimed.
- Workspaces are explicit JSON roots, not automatic package-manager glob inference.
- Blank checks do not validate formats, decoded escapes, actual credentials or runtime
  provisioning. An externally supplied declaration is a project rule, not proof.
- Parent-directory replacement by a concurrent hostile actor is outside portable Node
  filesystem guarantees; existing init guards and exclusive creation remain in force.
- External human feedback remains Pending — Requires Human Participation.

Next step: maintainer review, followed by owner-authorized hosted compatibility CI
and an independently verified new-version archive. No new publication is authorized.
