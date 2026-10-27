# Environment discovery and initialization — implementation report

Release follow-up: v1.2.0 is published and verified; see [the receipt](releases/1.2.0.json)
and PROGRESS.md. Original local implementation evidence below is historical.

Local feature, 2026-10-26. Package version remains 1.1.1. Not published or pushed.

Historical initial implementation report. The 2026-10-27 deep audit supersedes its
test counts, validation scope and alias/shadowing limitations; see
[FEATURE_QUALITY_AUDIT.md](FEATURE_QUALITY_AUDIT.md) and PROGRESS.md for current evidence.

Implemented scan/init/check onboarding, Babel AST extraction for JS/TS/JSX/TSX,
fixed classification rules, selected dotenv comparison, separate deterministic JSON,
consent-gated exclusive creation, safe pure placeholders and additive typed APIs.
Existing parser/analyzer/ISSUE_CODES/check JSON schema and exit semantics are retained.

Core files: src/discovery/{source,project,worker,cli}.js;
src/initialization/{template,create}.js; src/index.js and index.d.ts;
src/cli.js, bin/configpilot.js and shared terminal writer. The bounded config reader
now offers internal no-follow reads without changing check's symlink policy.
Package allowlist, dependency lock, offline consumer verifiers, CI minimum-runtime
setup, type consumers and test fixtures were updated. README, CLI/security/changelog,
architecture, feature guide, validation and PROGRESS document the behavior.

Verification: npm run check passed 187 tests, seven contracts, both installed compiler
consumer suites, lint and formatting. Coverage verification passed; parser/analyzer
remain at 100% line/branch coverage and source extractor at 100% lines. npm pack
--dry-run passed with 29 allowlisted files. All focused tests passed on available
Node 20.0.0/22/24/26 binaries on macOS; output guards also passed the full suite.
A real PTY prompt/creation trial used synthetic data. Runtime dependency audit found
zero known advisories. New native Windows/Linux CI was not run (push prohibited).

Security: scanned code/config/plugins never execute. AST workers, bytes, entries,
files, references, diagnostics and generated output are bounded. Values/literals and
native parser errors never enter findings. Only generated placeholders are previewed.
No existing file or .gitignore is overwritten. Exclusive create prevents concurrent
creator races. Git ignore uses only native check-ignore with hooks/fsmonitor disabled.

Five pinned public example selections passed static-reference inventory and CLI tests;
see SOURCE_DISCOVERY_VALIDATION.md and source-discovery-validation.json for measured
per-project results and scope. JSX in .js and legacy TS decorators were fixed after
these trials exposed gaps. No external user-feedback claims are made.

Limits/remaining risks: no alias/destructuring/full framework/flow analysis; unknown
computed names unresolved; confidence is heuristic; any local process binding suppresses
process discovery for that file. Empty defaults require human review. Root-level output
and root identity checks do not eliminate hostile ancestor replacement races. Failed
writes may leave a partial new file. Windows ACL/native terminal behavior and hosted
compatibility remain follow-up validation. See SOURCE_DISCOVERY.md for full contracts.

Next: local diff/security review, explicitly authorized hosted compatibility CI,
then broader real-repository/developer trials. Publication needs separate owner approval.
