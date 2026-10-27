# Discovery / initialization quality audit — 2026-10-27

Subsequent visual refinement: [CLI_DESIGN_REVIEW.md](CLI_DESIGN_REVIEW.md) compares
the supplied reference against the earlier renderer, documents the shared cards/badges/
panel implementation and includes actual terminal-emulator screenshots. Historical
audit counts below remain evidence for that audit; current verification is in PROGRESS.md.

Release follow-up: on 2026-10-27 the owner authorized v1.2.0 push/tag/publication after
the updated screenshots. The original local-only findings/verdict below are retained
as historical audit evidence. Current hosted compatibility and release gates are
tracked in RELEASE_PLAN_v1.2.0.md and PROGRESS.md; do not infer completion from approval.

Status: **NEEDS WORK for release — confirmed fixes verified locally; native compatibility gates remain.** Local audit only; no pushes,
publication, tags or deployments authorized. Historical feature test results do not
establish correctness. Findings below come from code review and adversarial regression
reproductions. Local results, measurements and outstanding release gates are recorded below.

## Confirmed findings and remediation tracking

| ID  | Severity / module                                | Reproduction; expected vs actual before fix                                                                                                                                 | Root cause and focused remedy                                                                                                                                                    |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01 | High correctness — source.js                     | Import process from node:process and read PORT; or shadow process in a nested function and read GLOBAL outside. Expected global/imported references; actual no names.       | File-wide boolean shadow suppression. Replace with lexical binding maps and recognize builtin process imports. Regression discovery-audit.test.js.                               |
| Q02 | High correctness — source.js                     | const env=process.env; env.API_KEY, and const {DATABASE_URL}=process.env. Expected resolved keys or explicit unresolved finding; actual neither.                            | Only direct members inspected. Track immutable aliases and static destructured keys; report escaped/mutable/unresolved objects without snippets.                                 |
| Q03 | Medium correctness — source.js                   | process.env[`API_KEY`]. Expected static key; actual dynamic.                                                                                                                | Computed property only accepts StringLiteral. Accept expression-free template AST nodes, never evaluate expressions.                                                             |
| Q04 | Medium correctness — source.js                   | (process.env.PORT as string) ?? 3000. Expected static fallback; actual absent.                                                                                              | Wrapper hides logical parent. Unwrap only known syntax wrappers; inspect the actual logical left/right AST.                                                                      |
| Q05 | Medium security warning — discovery/cli.js       | init --template --output .env --dry-run --json outside Git. Expected private warning; actual public-template and no warning.                                                | Flag overrides filename role. Known private filenames take precedence. No actual credential leak was observed.                                                                   |
| Q06 | Medium security warning — create.js              | Track .env, delete it, then add .env to ignore rules. Expected tracked-path warning; actual ignored.                                                                        | git check-ignore --no-index ignores tracked status. Remove no-index. Never change Git state.                                                                                     |
| Q07 | High workflow correctness — template.js / cli.js | Template-only EXTRA plus source PORT; init then check. Expected matching selected key sets; actual EXTRA missing. Local-only keys similarly omitted when creating template. | Generation uses source only. Merge selected parsed key names, never values, in CLI context; keep public scan JSON unchanged.                                                     |
| Q08 | Medium operational — bin / confirmation          | Interactive EOF or CI attached to a PTY. Expected default No and no file; old readline promise could remain pending, CI could prompt.                                       | No EOF/timeout/CI policy. Abort on EOF/SIGINT/idle deadline; disable prompting in indicated CI.                                                                                  |
| Q09 | Medium completeness — project.js                 | Vue/Svelte/Astro components in source. Expected honest partial scan; actual silently ignored with complete true.                                                            | Unsupported extensions not distinguished from irrelevant files. Report SOURCE_SKIPPED and incomplete; do not claim component support.                                            |
| Q10 | Medium evidence — previous validation            | Prior five selections cover only eight files, including empty starter cases. Expected realistic repository evidence; actual insufficient breadth.                           | Tiny corpus is useful smoke coverage, not real-repository validation. Run pinned full source inventories with an independent TS AST reference method and document discrepancies. |
| Q11 | Low resource contract — source.js                | 140,000 multibyte characters in a comment. Expected 256 KiB byte bound; actual UTF-16 length allowed it.                                                                    | Count UTF-8 bytes in pure source API too. Project reader was already byte-bounded.                                                                                               |
| Q12 | Low boundary correctness — project.js            | Exactly 4096 refs in one file followed by an empty source. Expected inclusive limit; actual precheck rejected next file.                                                    | Remove premature >= check; enforce cumulative > after extraction.                                                                                                                |
| Q13 | Medium operational — bin / confirmation          | Output fails while interactive preview is being written. Expected controlled cancellation; error handlers were installed only after runCli returned.                        | Register stream handlers before orchestration; abort prompt on output failure. No configuration-value leak reproduced.                                                           |
| Q14 | Medium UX — terminal / discovery CLI             | Ordinary scan hides locations unless verbose, repeats raw codes and long heuristic text per variable; recommends creating files that already exist.                         | Add compact grouped rows with first location, meaningful status labels and state-dependent next steps. Retain full JSON and verbose details.                                     |

Initial four scanner regression groups failed against the prior implementation;
all three initialization/Git-ignore regression groups also failed. This confirms
those defects independently of the existing passing suite. Targeted regression groups pass after the fixes; final suite evidence is below. Severity does not imply an exploited vulnerability.

Potential improvements / residual limits, not confirmed vulnerabilities: portable
Node path APIs cannot defeat hostile concurrent ancestor-directory replacement;
Windows ACL/native path semantics and fonts need actual native testing; pure scanSource
runs in the caller's process while scanProject workers have heap/time limits. Windows
reserved-name validation has additional portable-policy tests; no native Windows exploit
or execution result is claimed. No complete
framework, flow analysis, secret scanning or deployment validation is claimed.

## Executive summary and verdict

**NEEDS WORK** before publishing this new feature. The audit found substantive
correctness defects that the earlier 187 tests missed. Confirmed reproductions now
have focused fixes/regressions; no outstanding confirmed critical value-disclosure,
overwrite or code-execution defect was found in the reviewed paths. This is a maintainer
review, not an independent security certification or proof of complete discovery.

Release gates still open: native Windows/Linux execution for this revision and manual
terminal/permission checks; deliberate acceptance of unsupported component frameworks.
Vue/Svelte/Astro inputs are explicitly incomplete and initialization refuses them.
No package version bump, push, tag, publication or deployment is authorized/performed.
Published v1.1.1 behavior remains separate from this unreleased checkout.

## Additional audit findings

| ID  | Severity/category/module                                   | Reproduction and expected/actual                                                                                                                                                                                                                    | Root cause, resolution and regression                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q15 | Medium correctness / bindings.js                           | `enum process { env }; process.env.PORT` and a namespace named process should yield no global keys; previously PORT appeared. `function f(x=process.env.GLOBAL){var process=local;}` should retain GLOBAL; previously absent.                       | Missing TS value bindings and shared parameter/body scopes. Bind enum/namespace names and separate function-body var scopes. deep-additional.test.js reproduces and passes.                                                                                  |
| Q16 | Low portability / create.js, hardening                     | CONIN$, CONOUT$, COM¹.env, LPT².env and a C1-control filename passed validation. Expected portable policy rejection. Native Windows effects were not executed or claimed.                                                                           | Reserved-name/control list incomplete. Extend validation and verify the opened descriptor is a regular file before writing. deep-additional.test.js validates the policy on macOS.                                                                           |
| Q17 | Medium evidence / audit-real-projects.js                   | Initial TypeScript reference inventory missed 15 Express references that ConfigPilot reported. Expected independent lexical inventory; reference helper treated assignment-created global.process properties in another file as local declarations. | Correct the independent compiler host/module boundaries and accept only lexical declaration kinds for shadowing. Re-run all inventories: no unmatched named records. Discrepancies were never automatically labeled scanner false positives.                 |
| Q18 | Low resource/UX hardening / project.js, discovery reporter | Unsupported-component paths did not share the source-label guard; thousands of dynamic findings were verbose even in normal output.                                                                                                                 | Apply the 1024-character label guard before component diagnostics; normal view limits to 30 rows/20 notes and directs users to full JSON/verbose output. Complete reports stay bounded and unmodified.                                                       |
| Q19 | Medium workflow correctness / discovery reporter, CLI      | With only `.env.sample`, scan recommended init and local init then recommended default check; default check failed because `.env.example` was absent. Custom output guidance similarly implied default filenames.                                   | Reproduced failing before fix in workflow-audit.test.js. Recommend init --template for the sample fallback, and explicit check options for custom names; never interpolate paths into executable command strings. Complete sample/custom workflows now pass. |

Q20 — Medium operational, initialization/confirm.js: reopening `/dev/tty` read-only
reproduced `setRawMode EPERM`, a sanitized failure followed by a lingering input
handle. A synthetic raw-mode-denied stream also failed before the fix. Readline
construction and preview writes occurred outside cleanup. A yes/no line does not
need raw mode: use terminal:false and place setup inside try/finally with error
cancellation. Regression tests verify explicit Yes, raw-mode denial, thrown preview
writes and listener cleanup. The same reopened-TTY idle probe now defaults to No
and terminates; the full inherited-PTY accept/decline workflow was rerun successfully.

Q05 also has a new failing-before regression for `.env.qa`, `.env.preview` and
case variants. Every private `.env`/`.env.*` name now retains Git warnings unless it
is the explicit example/sample template. The generator's comments no longer claim
that template-only names were discovered in source.

## Architecture assessment

Keep the existing parser/analyzer and check JSON contract. Discovery is a separate
report/schema and execution path. Pure AST extraction now uses a lexical binding
module rather than file-wide shadow suppression. Filesystem scan stays in bounded,
sorted traversal with a dedicated empty-environment parser worker. CLI-only context
keeps selected key names privately for generation without changing public scan JSON.

Generation and creation remain separate. Exclusive open, root-level destination
validation, root identity recheck, no-follow guards and descriptor type validation
protect creation. The explicit API caller still owns consent; the CLI handles
confirmation and Git-ignore presentation. Rendering is now in reporters/discovery.js,
sharing the terminal writer instead of mixing presentation with command orchestration.
No new runtime dependency was added by this audit; existing Babel 7 remains pinned.

## Regression and workflow evidence

- Four initial scanner groups and three init/Git-ignore groups failed before their
  fixes; preserved pre-fix logs were inspected. Additional TS-binding and private-role
  cases were reproduced failing before their focused fixes.
- Actual A–J temporary project matrix covers no files, template-only, local-only,
  both files, no references, defaults, external provisioning, dynamic keys,
  malformed config and protected existing files. Source/env sentinels remain absent.
- Lexical imports, optional members, immutable aliases, destructuring, expression-free
  bracket templates, TS wrappers, nested functions/classes and framework prefixes are
  exercised against real AST parsing. Comments/strings remain ignored.
- 120 deterministic seeded mutations cross-check known generated names, fallback
  booleans, repeatability, malformed-input privacy and comment/string exclusion.
- Exclusive concurrent creation, Unicode/spaces, symlinks, readonly inputs, invalid
  UTF-8/binary files, exact 4096 references, 1001 files, >8 MiB source, >32 directory
  depth, parser-worker failure, and partial writes have behavioral assertions.
- EOF/default No, idle timeout, output failure and an actual CLI output-error injection
  cannot create a file. No tests execute the scanned project code.
- `.env.sample` onboarding and custom template/local output paths have complete
  follow-through assertions. Check's existing defaults and JSON remain unchanged.
- A real macOS PTY accepted/rejected confirmation using isolated synthetic files:
  decline created nothing; accepted template/local creation used mode 0600 and the
  resulting default check exited 0. The first harness attempt incorrectly piped stdin
  and correctly received INIT_CONFIRMATION_REQUIRED; rerun with inherited PTY passed.
  Reopened read-only /dev/tty initially exposed Q20; after its focused fix, the
  idle confirmation returned false without raw-mode failure or lingering handles.
  Native Terminal/iTerm/font appearance and other OS terminals remain unverified.

## Security findings and boundaries

No real credentials were read from user projects. Tests use synthetic sentinels;
public repository downloads exclude configuration files from extraction. Reports,
verbose text, generated content and controlled exceptions omit source/value literals.
Private-role/ignore bugs were inaccurate warnings, not reproduced value disclosure.
Workers have heap/time budgets, empty environment and no inherited Node startup args.
Resource limits stop work safely; incomplete scans cannot initialize.

Partial-write simulation confirms INIT_WRITE_FAILED and a possible partial newly
created file; it is not reported as success or silently deleted. Git check-ignore
retains tracked status, disables hooks/fsmonitor and never stages anything. Generated
configuration remains excluded by the explicit npm allowlist.

Residuals: portable path APIs cannot defeat hostile concurrent ancestor replacement;
Windows ACL inheritance/native paths remain untested here. Pure scanSource runs in
the caller process (bounded bytes), while scanProject isolates parser resource use.
Node's public process/environment object can be reassigned by runtime code; static
analysis cannot infer all such behavior or execute project plugins to resolve it.

## Real public repository validation

Six pinned repository source inventories were compared with an independent TypeScript
5 AST/type-checker lookup implementation, not ConfigPilot's own bindings. Independent
reference code does not use project compiler config, dependency installs or scripts.
Every retained file was re-verified against freshly downloaded commit archives.
251 source/component files matched byte-for-byte; 239 are scanned supported files.
Environment files were not extracted. Records include exact source hashes/commit SHAs.

| Repository                                                                                                                                                                    | Scanned | Variables / refs | Unmatched named refs | ms / RSS MiB     | Init preview    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------- | -------------------- | ---------------- | --------------- |
| [heroku/node-js-getting-started](https://github.com/heroku/node-js-getting-started/tree/8b8dec11fcf027522a857e0c831ee01b7124f673)                                             | 2       | 1 / 2            | 0 / 0                | 385.79 / 66.94   | preview         |
| [expressjs/express](https://github.com/expressjs/express/tree/1c6f1b0fe4000977b9a7b4f34097e4d527dd9824)                                                                       | 142     | 2 / 15           | 0 / 0                | 2568.92 / 100.16 | preview         |
| [fastify/demo](https://github.com/fastify/demo/tree/895908e4e706b896aa3991f3f6507617edddb1dd)                                                                                 | 46      | 11 / 32          | 0 / 0                | 718.13 / 80.19   | preview         |
| [vercel/nextjs-postgres-nextauth-tailwindcss-template](https://github.com/vercel/nextjs-postgres-nextauth-tailwindcss-template/tree/fe026711c19ac3ee4589c86a738f59b84e611559) | 33      | 1 / 1            | 0 / 0                | 694.13 / 78.34   | preview         |
| [antfu/vitesse-lite](https://github.com/antfu/vitesse-lite/tree/0b352977755e1f7f6399698e308777760409ca71)                                                                     | 8       | 1 / 1            | 0 / 0                | 336.17 / 69.41   | INIT_INCOMPLETE |
| [nestjs/typescript-starter](https://github.com/nestjs/typescript-starter/tree/0b6d71261ba30bb6976949a8653e4a86479a68c1)                                                       | 8       | 3 / 3            | 0 / 0                | 503.24 / 69.84   | preview         |

Measurements are single isolated scan-process probes on macOS arm64/Node 20.20.0,
including worker startup; background audit activity can affect timings. They are not
production performance promises or comparative benchmarks. Express includes source,
examples and tests. Source inventory excludes dependency/generated trees and env files;
no project builds or installations were executed. Five complete inventories generated
safe previews; the Vue/Vite application's unsupported components correctly caused
INIT_INCOMPLETE. No observed unmatched named references in supported source is not
proof of full framework coverage, interprocedural recall or runtime requiredness.
Full commit/source hashes and exact outcomes: feature-quality-repositories.json.
Reproduction helper: scripts/audit-real-projects.js with the pinned local manifest.

## Premium terminal UX

The supplied image is a design direction, not a bitmap terminal implementation.
Compact cyan branding/command tags, restrained status colors, bold names, muted
metadata, source-first grouped rows and prominent next steps translate its hierarchy
into a real terminal. No huge banners or CI animations. The later reference-led
refinement adds ANSI-filled metric blocks and a framed Next Steps panel; its actual
captures and owner-acceptance status are documented in CLI_DESIGN_REVIEW.md.

Scan distinguishes review/default/framework/other references, public-sensitive keys,
missing declarations, and unresolved findings. Init shows count, destination, existing
file protection, tracked-aware Git status, safe placeholders and default-No consent.
Success is concise, with configuration-aware next steps. Check groups severities,
keeps codes/locations, and explains causes/actions with less repeated text. Analyzer
and JSON prose/schema are unchanged. Ordinary/verbose/JSON output remain value-safe.

Width tests exercise 40/60/80/120/160 columns, long names and Unicode paths with
meaningful cell-width assertions. NO_COLOR/--no-color/TERM=dumb, forced color,
non-TTY/CI and Windows Terminal capability hints have deterministic tests. Symbols
have ASCII fallbacks and labels; color is never the sole signal. Native terminal
fonts/renderers and Windows behavior have not been certified by simulation.
Captured scan/init/check/missing-file examples in SOURCE_DISCOVERY.md come from actual
synthetic CLI runs. README quick-start output is executable-test checked.

## Known limitations and release recommendation

No complete Vue SFC, Svelte/Astro component or Nuxt runtimeConfig parsing, dynamic
expression evaluation, interprocedural flow or arbitrary process reassignment tracking.
Immutable aliases are bounded to 32 binding hops. Findings classify potential purpose,
not proven secrets or runtime requirements. Public prefixes do not make credentials safe.
NODE_ENV may be supplied by frameworks but remains a discovered application key;
no project-framework detector is advertised. Real external developer feedback remains
uncollected and no feedback result is fabricated.

Docker's client exists but its daemon is unreachable, so Linux was not executed.
No Windows runner is accessible without the explicitly prohibited push. Validate the
exact revision on native Linux/Windows and review fonts/permissions before release.
Optional future work: component parsing, broader audited framework conventions and
coverage improvements around hostile worker/filesystem failure branches. No major
breaking API decision is included. The current verdict is NEEDS WORK for release,
with no outstanding known failing correctness/security regression in local tests.

## Final automated verification

Executed on macOS arm64, Node 20.20.0, 2026-10-27:

| Command / evidence                                               | Actual result                                                                                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm run check                                                    | PASS: lint, 227 runtime tests, seven independent contracts, installed TypeScript consumers and formatting                                                |
| npm run test:coverage                                            | PASS: 227 tests; parser/analyzer exceed enforced 90% line/branch gates                                                                                   |
| Installed package consumer (part of npm test)                    | PASS: exact allowlist/content comparison, offline installation, existing and new API/worker calls, actual CLI/shim execution, synthetic secret exclusion |
| TypeScript 5.0.4 / 7.0.2                                         | PASS: installed NodeNext/Bundler positive/negative cases, emitted ESM and CommonJS dynamic import                                                        |
| Focused audit suite on Node 20.0.0 / 22.13.0 / 24.22.1 / 26.12.1 | PASS: 40 tests per runtime on macOS; this is not a native cross-platform run                                                                             |
| Real PTY synthetic workflow                                      | PASS: decline, explicit Yes, default check and mode 0600; separate reopened-TTY timeout safely cancels after Q20                                         |

| Critical module            |  Lines | Branches |
| -------------------------- | -----: | -------: |
| dotenv-parser.js           |   100% |     100% |
| config-analyzer.js         |   100% |     100% |
| discovery/source.js        |   100% |   98.68% |
| discovery/bindings.js      | 99.60% |   97.46% |
| discovery/project.js       | 93.07% |   92.81% |
| discovery/cli.js           | 96.98% |   91.07% |
| initialization/template.js |   100% |      90% |
| initialization/create.js   |   100% |   84.62% |
| initialization/confirm.js  |   100% |      80% |

Coverage is from Node's test coverage instrumentation; it does not establish semantic
correctness or coverage of native Windows branches. Failure-injection and independent
reference comparisons provide additional evidence. Logs retained locally under
/private/tmp/configpilot-deep-audit-final-{check,coverage}.log and
/private/tmp/configpilot-deep-audit-node-VERSION.log. Pre-fix reproductions include
configpilot-deep-audit-before.log, configpilot-deep-additional-before.log,
configpilot-sample-before.log and configpilot-confirm-setup-before.log.

## Reviewed and changed areas

Final package inspection: `npm pack --dry-run --ignore-scripts --json` passed with
32 allowlisted files (62,146 packed bytes; 209,061 unpacked bytes). No environment
files, fixtures, downloaded projects or private configuration are included. The
installed-package test also plants synthetic secrets in staging and verifies every
installed file against the checkout. Final documentation formatting and git diff
whitespace checks passed. Audit/progress records are not part of the npm archive.

The task began with an uncommitted discovery implementation; existing work was preserved.
The local feature and audit diff includes:

- src/discovery/{source,bindings,project,worker,cli}.js: static extraction, lexical
  resolution, bounded traversal/worker isolation, configuration context and commands.
- src/initialization/{template,create,confirm}.js: safe generation, explicit exclusive
  creation, path/ignore policy and bounded line confirmation.
- src/reporters/{terminal,discovery}.js, src/cli.js and bin/configpilot.js: compact
  rendering, terminal capabilities, preserved check routing and early output handlers.
- test/unit/{discovery-audit,deep-additional,confirmation-audit,premium-rendering}.test.js
  and test/integration/{workflow-audit,workflow-matrix,security-quality}.test.js: new
  adversarial, privacy, end-to-end, failure-injection and UI regressions.
- Existing discovery/initialization, reporter, terminal, package, API/type and contract
  tests remain exercised; package consumers verify the actual installed bytes.
- scripts/audit-real-projects.js and feature-quality-repositories.json: independent
  corpus inventory and measured public-source records. No application code execution.
- README, CLI/source-discovery/architecture guides, SECURITY, CHANGELOG, STABILITY,
  implementation report and PROGRESS: current contracts, examples and remaining gates.

## Release-readiness checklist and next action

- [x] Confirmed local defects reproduced, fixed and regression tested.
- [x] Public check API, issue codes, JSON schema and exit policy preserved.
- [x] Source-scanner syntax, classifications and explicit unsupported cases documented.
- [x] Consent, no-overwrite, privacy and resource-limit checks pass locally.
- [x] Six pinned public inventories and synthetic A–J workflows evaluated honestly.
- [x] Local quality, minimum/later Node runtimes and installed consumers pass.
- [ ] Execute this exact revision on native Windows and Linux; published-version CI
      receipts are historical and cannot satisfy this gate.
- [ ] Review actual Windows Terminal/PowerShell and macOS/Linux terminal appearance,
      native path/ACL behavior and fonts. Width/capability simulation is not certification.
- [ ] External developer feedback: Pending — Requires Human Participation. This audit
      supplies independent source trials, not invented end-user acceptance.
- [ ] Owner release review/approval for any future publication; currently prohibited.

The single most valuable next step is native Windows/Linux validation of these exact
bytes. Keep publication on hold until the required compatibility results are reviewed.
Component-framework parsing and broader flow inference are optional future milestones,
not claims of this JS/TS release scope. The current release verdict remains NEEDS WORK.

## Release follow-up — native compatibility findings

Q21 — High Windows compatibility, utils/read-config-file.js: native Node 22.13.0
rejected unchanged source files because path and descriptor device IDs differed.
A dedicated isolated regression confirmed canonical paths and matching inode IDs,
with differing volume serials. Windows normalization follows libuv's 32-bit serial
policy; a missing path serial uses an independently opened descriptor witness and
named-file rechecks instead of discarding device identity. BigInt IDs prevent
precision loss. Unit tests reject differing devices/inodes and replacement files.
A separate test-harness preload now uses a portable file URL.

All 12 OS/Node jobs and minimum Node 20.0.0 passed at 41efc64 in hosted run
40462042075; final release delivery requires successful CI for the final PR and
merged main. Local verification now passes 238 tests, seven contracts, TypeScript
5.0.4/7.0.2 consumers, lint/format and coverage. There is no known remaining
confirmed critical security/correctness defect. Publication gates and the exact
archive are tracked in PROGRESS.md and the release receipt. External human trials
remain pending. The original local-only NEEDS WORK verdict above is historical.
