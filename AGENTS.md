# AGENTS.md — ConfigPilot

> Master project specification, implementation roadmap, and operating instructions for AI coding agents.

## 1. Project Overview

**Project:** ConfigPilot\
**Package type:** Open-source npm package\
**Language:** JavaScript (ES Modules)\
**Minimum runtime:** Node.js 20+\
**Distribution:** npm and GitHub\
**License:** MIT\
**Initial release:** v0.1.0\
**Target:** Production-quality developer tooling\
**Status:** Planning — implementation and verification pending

### Mission

Build ConfigPilot, a professional command-line tool and reusable JavaScript library that helps developers analyze, compare, understand, and maintain environment-variable configurations.

ConfigPilot must identify configuration problems, explain their consequences, and recommend safe actions without exposing secret values.

The product should be useful for individual developers, open-source maintainers, development teams, and CI/CD pipelines.

### Product positioning

**ConfigPilot is an explainable environment-configuration diagnostic tool.**

Existing tools already validate environment variables, lint `.env` files, and compare configuration keys.

ConfigPilot must differentiate through:

1. Clear and actionable diagnostics.
2. Useful explanations for beginners and experienced developers.
3. Security-conscious analysis.
4. Easy command-line integration.
5. Machine-readable reports.
6. Minimal configuration.
7. Excellent documentation and developer experience.

Do not claim ConfigPilot is the first tool to provide functionality already available elsewhere.

---

## 2. Instructions for All Coding Agents

### Mandatory working principles

All agents working on this project must:

- Read this document before making changes.
- Inspect the repository before implementing features.
- Preserve existing working functionality.
- Prefer simple, maintainable solutions.
- Follow established JavaScript conventions.
- Keep the core package lightweight.
- Write tests for new functionality.
- Update documentation when behavior changes.
- Avoid unnecessary dependencies.
- Protect user configuration data.
- Maintain compatibility with supported Node.js versions.
- Never publish packages without explicit owner approval.

### Implementation rules

1. Do not introduce features outside the active milestone without a clear justification.
2. Do not make breaking API changes without documenting them.
3. Do not store or print environment-variable values in reports.
4. Do not automatically rewrite configuration files.
5. Avoid executing any project code while analyzing configuration files.
6. All analysis must be deterministic where possible.
7. Prefer functions with explicit inputs and outputs.
8. Separate business logic from CLI presentation.
9. Make errors understandable and actionable.
10. Never claim tests passed unless they were actually executed.

### Definition of Done

A task is complete only when:

- The implementation works.
- Relevant automated tests pass.
- Edge cases have been considered.
- No known security regressions were introduced.
- Documentation is updated.
- The implementation is consistent with the architecture.
- Any limitations are clearly documented.

---

## 3. Intended Users

### Primary users

**Frontend developers**

Need to understand missing environment variables in React, Next.js, Vue, and similar applications.

**Backend developers**

Need reliable configuration checks for Node.js services.

**Open-source contributors**

Need clear instructions when cloning and configuring unfamiliar projects.

**DevOps engineers**

Need machine-readable diagnostics for CI pipelines.

**Development teams**

Need consistency across local, development, staging, and production configuration templates.

### Core problem

Environment configuration errors can be difficult to diagnose.

Examples:

- A documented variable is missing.
- An application uses an undocumented variable.
- Duplicate assignments create unexpected behavior.
- Configuration templates become outdated.
- New contributors do not know how to configure a project.
- Different deployment environments use inconsistent key names.

ConfigPilot must help developers identify and resolve these problems safely.

---

## 4. Competitive Positioning

Review these projects periodically:

- dotenv
- dotenv-safe
- envalid
- dotenv-linter
- dotenv-diff

### Differentiation goals

ConfigPilot should emphasize:

- Human-readable explanations.
- Actionable recommendations.
- Structured issue codes.
- Consistent CLI output.
- Secure handling of configuration information.
- Documentation quality.
- Ease of integration.

Do not spend time rebuilding advanced functionality already implemented well by existing libraries unless doing so creates measurable value.

Validate important assumptions using real projects and developer feedback.

---

## 5. Technology Stack

### Required

- JavaScript
- Node.js
- npm
- ES Modules
- Git
- GitHub
- GitHub Actions

### Recommended development tooling

- Node.js built-in test runner, or Vitest if justified.
- ESLint for static analysis.
- Prettier for consistent formatting.
- npm package scripts.
- TypeScript declaration files for JavaScript API consumers.

### Architecture principles

- Minimal runtime dependencies.
- Cross-platform operation.
- Well-defined public API.
- Deterministic diagnostics.
- Clear separation of concerns.
- Strong error handling.
- Testable modules.

Do not introduce a backend server, database, AI service, or external account requirement for the core package.

---

## 6. Target Repository Structure

```text
configpilot/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── release.yml
│   └── ISSUE_TEMPLATE/
├── bin/
│   └── configpilot.js
├── src/
│   ├── index.js
│   ├── parser/
│   │   └── dotenv-parser.js
│   ├── analyzer/
│   │   └── config-analyzer.js
│   ├── diagnostics/
│   │   ├── issue-codes.js
│   │   └── recommendations.js
│   ├── reporters/
│   │   ├── terminal.js
│   │   └── json.js
│   └── utils/
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── examples/
├── docs/
├── AGENTS.md
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
├── LICENSE
├── .editorconfig
├── .gitignore
└── package.json
```

This is a target structure. Begin with fewer modules if appropriate, and split files when complexity warrants it.

---

# 7. Product Requirements

## 7.1 Environment File Parsing

The parser must support common dotenv syntax, including:

- Empty lines.
- Comments.
- Standard key-value assignments.
- Optional `export` prefixes.
- Whitespace handling.
- Quoted values.
- Escaped characters.
- Values containing `=`.
- Duplicate keys.
- Windows and Unix line endings.

Before claiming complete dotenv compatibility, test behavior against a documented parsing specification or mature reference implementation.

Complex multiline values and variable interpolation may initially be unsupported, but limitations must be explicit.

### Critical requirement

Values may be read temporarily to parse the file, but must never be included in diagnostic objects, terminal output, JSON reports, or logs.

Prefer retaining only variable names and source locations.

## 7.2 Configuration Comparison

Compare a reference configuration with an actual configuration.

Detect:

- Missing keys.
- Undocumented keys.
- Duplicate keys.
- Invalid declarations.

Distinguish between:

- Confirmed syntax issues.
- Potential configuration inconsistencies.
- Informational findings.

Do not assume a missing local key means a deployment is broken; it may be supplied externally.

## 7.3 Diagnostic Engine

Each issue must have a stable structured format.

Example:

```javascript
{
  code: "MISSING_KEY",
  severity: "error",
  key: "DATABASE_URL",
  location: {
    file: ".env.example",
    line: 4
  },
  message: "DATABASE_URL is not defined in the local configuration.",
  recommendation: "Provide DATABASE_URL locally or through the deployment environment."
}
```

Supported severities:

- `error`
- `warning`
- `info`

Issue codes must be documented and stable.

## 7.4 Command-Line Interface

Target usage:

```bash
configpilot check
```

With options:

```bash
configpilot check --template .env.example --env .env
```

JSON output:

```bash
configpilot check --json
```

Help:

```bash
configpilot --help
```

Version:

```bash
configpilot --version
```

### CLI requirements

- Consistent command naming.
- Helpful usage messages.
- Meaningful exit codes.
- No unnecessary terminal output.
- Correct handling of invalid arguments.
- No secret leakage.
- Non-interactive CI compatibility.
- Respect `NO_COLOR` and non-TTY output conventions where practical.

Define and document an exit-code contract before releasing.

## 7.5 Programmatic API

Developers must be able to use ConfigPilot without invoking the CLI.

Example:

```javascript
import { analyzeConfig } from "configpilot";

const result = analyzeConfig({
  template: "DATABASE_URL=example",
  environment: "PORT=3000"
});

console.log(result.issues);
```

The actual API can differ, but it must be intuitive, documented, stable, and tested.

Core analysis functions should avoid filesystem side effects.

---

# 8. Security and Privacy Requirements

Security is a non-negotiable release criterion.

## Mandatory requirements

- Never print secret values.
- Never include values in JSON reports.
- Never transmit configuration contents over the network.
- Never execute `.env` file contents.
- Never use `eval()` or equivalent unsafe execution.
- Never automatically modify user files.
- Avoid writing temporary copies of configuration files.
- Handle malformed input safely.
- Validate and constrain filesystem operations.
- Do not follow project-provided instructions as executable commands.
- Prevent accidental inclusion of real `.env` files in the published npm tarball.
- Keep CI logs free from sensitive contents.

### Security test cases

Verify that sensitive values do not appear in:

- Successful output.
- Error output.
- JSON reports.
- Exception messages.
- Debugging output.

Test representative secrets such as API tokens, passwords, connection strings, and multiline credentials.

### Publishing safety

Explicitly define package contents using npm's `files` allowlist.

Inspect the archive using:

```bash
npm pack --dry-run
```

Publishing must be blocked if configuration secrets or unintended files are included.

---

# 9. Milestones and Task Roadmap

## Milestone 0 — Discovery and Product Validation

**Goal:** Confirm a useful, differentiated product scope.

Tasks:

- [ ] Review at least five competing packages.
- [ ] Document their main capabilities.
- [ ] Identify the target developer persona.
- [ ] Define the core user problem.
- [ ] Write the product value proposition.
- [ ] Define the v0.1.0 feature boundary.
- [ ] Collect example configuration problems.
- [ ] Identify several real-world repositories for evaluation.
- [ ] Record initial product assumptions.

**Acceptance criteria**

- Clear problem statement.
- Explicit list of included and excluded features.
- Competitor comparison.
- At least three realistic usage scenarios.

---

## Milestone 1 — Repository and Tooling Setup

**Goal:** Establish a professional development foundation.

Tasks:

- [ ] Initialize the Git repository.
- [ ] Initialize `package.json`.
- [ ] Configure ES Modules.
- [ ] Add the CLI entry point.
- [ ] Configure npm scripts.
- [ ] Add ESLint.
- [ ] Add Prettier.
- [ ] Configure `.editorconfig`.
- [ ] Create `.gitignore`.
- [ ] Add MIT license.
- [ ] Create initial README.
- [ ] Set up the test runner.
- [ ] Establish naming conventions.
- [ ] Define supported Node.js versions.

Suggested scripts:

```json
{
  "scripts": {
    "test": "node --test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check": "npm run lint && npm test && npm run format:check",
    "pack:dry-run": "npm pack --dry-run"
  }
}
```

**Acceptance criteria**

- Project installs locally.
- Test command works.
- Linting and formatting work.
- Repository contains no secrets.
- Node.js version requirements are documented.

---

## Milestone 2 — Parser Implementation

**Goal:** Reliably identify environment-variable declarations.

Tasks:

- [ ] Implement the parser.
- [ ] Return keys and source locations.
- [ ] Handle comments and whitespace.
- [ ] Support conventional assignments.
- [ ] Detect invalid lines.
- [ ] Detect duplicates.
- [ ] Handle quoted values safely.
- [ ] Handle platform-specific line endings.
- [ ] Define unsupported syntax behavior.
- [ ] Ensure diagnostic output contains no values.

**Acceptance criteria**

- Representative valid files parse correctly.
- Malformed input produces controlled diagnostics.
- Parser tests cover supported syntax.
- Secret values do not appear in results.
- Unsupported syntax is documented.

---

## Milestone 3 — Comparison and Diagnostic Engine

**Goal:** Turn configuration differences into useful explanations.

Tasks:

- [ ] Compare expected and actual key sets.
- [ ] Detect missing variables.
- [ ] Detect undocumented variables.
- [ ] Include duplicate and syntax findings.
- [ ] Define diagnostic codes.
- [ ] Assign appropriate severity.
- [ ] Add actionable recommendations.
- [ ] Produce deterministic issue ordering.
- [ ] Return a summary object.
- [ ] Document the report schema.

**Acceptance criteria**

- Analysis works without accessing the filesystem.
- Every diagnostic has a stable code.
- Recommendations are specific.
- Results are deterministic.
- No configuration values appear in reports.

---

## Milestone 4 — Professional CLI

**Goal:** Deliver a usable command-line experience.

Tasks:

- [ ] Implement `configpilot check`.
- [ ] Add file path options.
- [ ] Add help output.
- [ ] Add version output.
- [ ] Add readable terminal formatting.
- [ ] Add JSON output.
- [ ] Define exit codes.
- [ ] Handle missing files.
- [ ] Handle invalid arguments.
- [ ] Support CI usage.
- [ ] Respect color-output conventions.
- [ ] Test paths with spaces.
- [ ] Test Windows-compatible path handling.

**Acceptance criteria**

- CLI works from another directory.
- Help output is complete.
- JSON output is parseable.
- Exit codes match documentation.
- Errors remain safe and understandable.

---

## Milestone 5 — Automated Testing and Quality

**Goal:** Achieve reliable behavior across supported environments.

### Unit tests

- [ ] Parser.
- [ ] Comparison engine.
- [ ] Recommendations.
- [ ] Report formatting.
- [ ] Invalid input handling.

### Integration tests

- [ ] Execute the actual CLI.
- [ ] Verify exit codes.
- [ ] Verify JSON output.
- [ ] Verify terminal output.
- [ ] Test missing files.
- [ ] Test malformed configuration.
- [ ] Test paths containing spaces.
- [ ] Test Unicode paths.
- [ ] Verify package imports.

### Security tests

- [ ] Assert secrets never appear in output.
- [ ] Assert source files remain unchanged.
- [ ] Assert malformed input cannot execute code.
- [ ] Assert the npm package excludes unwanted files.

### Quality targets

- Strong coverage of critical branches.
- No failing tests.
- No known secret-leakage defects.
- Clean lint and formatting results.
- Reproducible results.

Aim for at least 90% line coverage in the core parser and analyzer, but prioritize meaningful assertions over a numerical target.

**Acceptance criteria**

All required checks pass on supported Node.js versions.

---

## Milestone 6 — Documentation and Developer Experience

**Goal:** Make the package easy to discover, understand, install, and contribute to.

Tasks:

- [ ] Write a professional README.
- [ ] Add a compelling introduction.
- [ ] Explain the problem solved.
- [ ] Add installation instructions.
- [ ] Add quick-start commands.
- [ ] Provide real terminal-output examples.
- [ ] Document all CLI options.
- [ ] Document exit codes.
- [ ] Document the JavaScript API.
- [ ] Explain security guarantees and limitations.
- [ ] Add troubleshooting guidance.
- [ ] Create `CONTRIBUTING.md`.
- [ ] Create `SECURITY.md`.
- [ ] Create `CHANGELOG.md`.
- [ ] Add usage examples.
- [ ] Document supported runtimes.
- [ ] Add package metadata and repository links.

### README quality standard

A first-time visitor should understand what ConfigPilot does and how to try it within approximately one minute.

Avoid exaggerated claims, excessive badges, and unsupported performance comparisons.

---

## Milestone 7 — GitHub and CI/CD

**Goal:** Automate verification and prepare reliable releases.

Tasks:

- [ ] Create GitHub Actions CI workflow.
- [ ] Test on supported Node.js versions.
- [ ] Test Linux, Windows, and macOS where feasible.
- [ ] Run lint checks.
- [ ] Run formatting checks.
- [ ] Run automated tests.
- [ ] Run package import smoke tests.
- [ ] Inspect packed package contents.
- [ ] Add dependency update automation.
- [ ] Configure appropriate repository permissions.
- [ ] Use least-privilege CI credentials.
- [ ] Set up release workflow.
- [ ] Require approval before publishing.

### CI requirements

Pull requests must pass all mandatory checks before merging.

Use minimal GitHub Actions permissions and pin third-party actions to trusted versions or immutable commit references when practical.

---

## Milestone 8 — npm Release Readiness

**Goal:** Prepare a stable first public release.

Tasks:

- [ ] Verify npm package-name availability.
- [ ] Confirm ownership of the chosen package name.
- [ ] Review package metadata.
- [ ] Configure `main`/`exports` and `bin` appropriately.
- [ ] Ensure CLI executable configuration is correct.
- [ ] Verify supported Node.js versions.
- [ ] Add TypeScript declaration support.
- [ ] Test installation in a separate consumer project.
- [ ] Verify CommonJS compatibility requirements or document ESM-only usage.
- [ ] Run `npm pack --dry-run`.
- [ ] Inspect the complete package archive.
- [ ] Verify no secrets are packaged.
- [ ] Review npm authentication and publishing security.
- [ ] Prepare release notes.
- [ ] Tag the release only after approval.

### Publishing safeguards

Do not run `npm publish` automatically.

Publishing requires explicit approval from the repository owner.

Follow current npm trusted-publishing recommendations where supported.

Use two-factor authentication and least-privilege credentials.

**Acceptance criteria**

A clean external project can install, import, and execute the package successfully.

---

## Milestone 9 — Public Release v0.1.0

**Goal:** Publish the first professional release.

Tasks:

- [ ] Confirm release checklist.
- [ ] Obtain owner approval.
- [ ] Publish to npm.
- [ ] Verify the npm package page.
- [ ] Test installation from npm.
- [ ] Create GitHub release.
- [ ] Publish release notes.
- [ ] Confirm README examples work.
- [ ] Add installation instructions to GitHub.
- [ ] Collect initial user feedback.

**Acceptance criteria**

The package installs and works through the public npm registry.

---

# 10. Post-Release Roadmap

## v0.2.0 — Improved Diagnostics

Potential features:

- Improved severity customization.
- Better suggestions for missing variables.
- Markdown report output.
- Additional parser compatibility.
- Optional handling of externally supplied variables.

## v0.3.0 — Multi-Environment Support

Potential features:

- Compare several explicitly selected configuration templates.
- Detect environment-specific mismatches.
- Generate a presence matrix.
- Report configuration differences without displaying values.

## v0.4.0 — Developer Integrations

Potential features:

- GitHub Actions integration.
- Improved CI reporting.
- Editor-friendly diagnostics.
- Configuration policy files.

## v0.5.0 — Source Reference Analysis

Potential features:

- Detect common `process.env` references.
- Identify likely undocumented variables.
- Report potentially unused configuration declarations.
- Support selected JavaScript frameworks.

Use a proper parser rather than relying only on regular expressions for complex source-code analysis.

Clearly label uncertain findings.

## v1.0.0 — Stable Professional Release

Requirements:

- Stable public API.
- Comprehensive documentation.
- Strong automated tests.
- Verified compatibility.
- Security review.
- Clear release and deprecation policies.
- Positive feedback from real users.
- Reliable release automation.

Do not release v1.0.0 solely because a checklist has been completed. Public API stability and real-world usage matter.

---

# 11. API and Compatibility Standards

The public API must:

- Use clear function names.
- Avoid unnecessary side effects.
- Return predictable structured results.
- Document expected errors.
- Avoid exposing internal implementation details.
- Preserve compatibility within documented versioning rules.

Follow Semantic Versioning when releasing.

Before v1.0.0, clearly document any breaking changes even if pre-1.0 versioning permits them.

Add TypeScript declarations and verify them with a small TypeScript consumer project.

---

# 12. Performance Requirements

ConfigPilot should remain lightweight.

Goals:

- Fast startup.
- Low memory usage.
- No unnecessary network requests.
- Efficient parsing of normal configuration files.
- Minimal runtime dependencies.

Measure performance before making benchmark claims.

Set reasonable input-size limits or document behavior for unusually large files.

Do not optimize prematurely at the expense of clarity and correctness.

---

# 13. Portfolio Quality Requirements

This project must demonstrate professional software engineering practices.

The GitHub repository should showcase:

1. Clear product thinking.
2. A well-defined problem.
3. Thoughtful architectural decisions.
4. Clean JavaScript.
5. Automated testing.
6. Security awareness.
7. Professional documentation.
8. CI/CD implementation.
9. Meaningful versioning.
10. Open-source maintainability.

### Suggested portfolio presentation

**ConfigPilot — Explainable Environment Configuration Diagnostics**

A lightweight Node.js CLI and JavaScript library that detects environment-configuration inconsistencies, generates actionable recommendations, and protects sensitive values.

Do not describe planned features as already implemented.

---

# 14. Agent Execution Workflow

When an agent receives a development task:

### Step 1 — Inspect

- Read `AGENTS.md`.
- Inspect relevant source files.
- Review the active milestone.
- Check the current Git status.
- Identify existing tests and functionality.

### Step 2 — Plan

- Describe the intended change.
- Identify affected modules.
- Consider backward compatibility.
- Identify tests required.
- Note security implications.

### Step 3 — Implement

- Make focused changes.
- Reuse existing modules.
- Avoid unnecessary abstractions.
- Keep the implementation readable.

### Step 4 — Verify

- Run relevant unit tests.
- Run integration tests where applicable.
- Run lint and formatting checks.
- Inspect outputs for unintended secret exposure.
- Confirm no unrelated behavior changed.

### Step 5 — Document

- Update README or API documentation.
- Update examples when necessary.
- Record notable changes.
- Update milestone progress.

### Step 6 — Report

Provide:

- What was implemented.
- Files changed.
- Tests executed.
- Test results.
- Known limitations.
- Recommended next task.

Never invent test results.

---

# 15. Development Progress Tracking

Maintain a development progress document named:

`docs/PROGRESS.md`

For every milestone, record:

- Status: Not Started / In Progress / Blocked / Complete.
- Completed tasks.
- Outstanding tasks.
- Decisions made.
- Test results.
- Remaining risks.

Update it at the end of each development session.

### Initial status

| Milestone             | Status      |
| --------------------- | ----------- |
| 0 — Discovery         | In Progress |
| 1 — Repository setup  | Not Started |
| 2 — Parser            | Not Started |
| 3 — Diagnostics       | Not Started |
| 4 — CLI               | Not Started |
| 5 — Testing           | Not Started |
| 6 — Documentation     | Not Started |
| 7 — CI/CD             | Not Started |
| 8 — Release readiness | Not Started |
| 9 — Publication       | Not Started |

Prior conversations included a proposed prototype, but its files could not be created or verified because the workspace was read-only. Do not assume that implementation exists.

---

# 16. Immediate Next Tasks

The next coding agent should:

1. Inspect the repository and confirm its actual state.
2. Create or verify the project structure.
3. Initialize `package.json`.
4. Implement the minimal parser.
5. Implement key-set comparison.
6. Define structured diagnostics.
7. Build the first working CLI command.
8. Add automated tests.
9. Run the tests.
10. Demonstrate a realistic configuration mismatch.
11. Update `docs/PROGRESS.md`.
12. Stop before npm publication.

## First milestone demonstration

The following command should work:

```bash
configpilot check
```

Expected conceptual output:

```text
ConfigPilot — Configuration Analysis

ERROR   DATABASE_URL
        Missing from local configuration.

WARNING REDIS_URL
        Not documented in the reference template.

Summary:
1 error
1 warning

Review the reported configuration keys.
No files were modified.
```

The precise formatting may evolve, but the implementation must preserve the core principles: clarity, actionability, determinism, and privacy.

---

# 17. Final Project Objective

Build an npm package that developers can confidently install and use in real applications.

The final product must be:

- Useful.
- Secure.
- Lightweight.
- Reliable.
- Well-tested.
- Professionally documented.
- Easy to maintain.
- Easy to contribute to.
- Suitable for a strong software engineering portfolio.

**The objective is not merely to publish an npm package. It is to build a trustworthy open-source developer tool that solves a genuine problem.**

---

## Agent Starting Instruction

When beginning work, read this entire document, inspect the repository, determine the current milestone, and proceed with the smallest useful implementation.

Prioritize correctness, maintainability, user experience, and security.

Do not skip verification.

Do not publish without explicit approval.

**Start with Milestone 1, unless repository inspection proves some tasks are already complete.**
