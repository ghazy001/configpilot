# ConfigPilot v0.1.0

Release date: **2026-10-26**. Initial public release.

ConfigPilot compares environment-variable declarations and explains missing keys,
undocumented keys, duplicate assignments and unsupported syntax. It provides a
Node.js CLI and reusable JavaScript API without runtime dependencies.

## Included

- `configpilot check` with default or explicit template/environment paths,
  readable terminal output and schema-version-1 JSON reports.
- Stable diagnostic codes, source locations, actionable recommendations and
  deterministic ordering. Missing keys may be supplied externally and are warnings.
- Pure synchronous `parseDotenv` and `analyzeConfig` APIs, frozen `ISSUE_CODES`,
  bundled TypeScript declarations and discriminated complete/skipped reports.
- Read-only, bounded UTF-8 file access, controlled operational errors, and no
  assignment values or raw invalid lines in reports. No network or code execution.
- Exit codes 0 for clean/help/version, 1 for analysis findings, 2 for operational
  failure. Warnings deliberately fail CI checks.

## Compatibility and limitations

Node.js 20+ and ES modules. CommonJS consumers may use dynamic import; a synchronous
CommonJS entry point is not supported. Declarations are checked with TypeScript 7.0.2
under NodeNext and Bundler resolution. No build step is required for runtime use.

The parser supports the [documented single-line subset](PARSER.md), not full dotenv
compatibility. Physical multiline values are quarantined; interpolation is not
resolved. Syntax errors skip key differences. Empty values count as declarations.
The CLI accepts regular UTF-8 files up to 1 MiB each; the pure parser accepts up to
1,048,576 UTF-16 code units. Names/file labels are public metadata. This is not a
secret scanner, value validator or deployment-health check.

This is the initial release; there is no prior released API to migrate.
Future breaking changes must be documented explicitly, including before v1.0.

## Install

```sh
npm install --global configpilot@0.1.0 --ignore-scripts --no-audit --no-fund
configpilot --help
```

For a project dependency, use `npm install --save-dev configpilot@0.1.0`.
Follow [the README](../README.md) for local checks and JavaScript API usage.
The [changelog](../CHANGELOG.md) records the implemented changes. The initial local
publication has no GitHub OIDC provenance attestation; future trusted-publisher
automation is a separate setup.
