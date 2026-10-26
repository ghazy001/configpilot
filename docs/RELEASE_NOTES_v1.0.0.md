# ConfigPilot v1.0.0

ConfigPilot compares environment-variable declarations and explains missing,
undocumented, duplicate and invalid declarations without reporting assignment values.

```sh
npm install --global configpilot@1.0.0
configpilot check
```

For project development scripts: `npm install --save-dev configpilot@1.0.0`.
For the JavaScript API at runtime: `npm install configpilot@1.0.0`.
No extra installation flags are required.

## Stable contracts

- Pure synchronous ESM exports: parseDotenv, analyzeConfig, ISSUE_CODES; Node.js 20+.
- Six documented diagnostic codes, deterministic ordering, schema-version-1 reports,
  shipped JSON Schema and bundled TypeScript declarations.
- CLI check/template/env/json/help/version; exits 0 clean, 1 findings, 2 operational error.
- No runtime dependencies, configuration writes, environment execution or network calls.

## Upgrade from 0.1.0

Quoted-input recovery now protects ambiguous and nonportable boundaries. Some inputs
previously accepted can produce parser errors; comparisons are skipped until syntax
issues are resolved. New per-input record/metadata budgets raise RangeError or CLI
INPUT_LIMIT_EXCEEDED (exit 2), without partial results. See CHANGELOG.md and the
parser documentation before upgrading unusually dense or loader-specific inputs.
Function signatures, six analysis codes and normal CLI behavior remain unchanged.

The package does not validate values or runtime provisioning, expand interpolation,
support physical multiline values, or promise complete dotenv compatibility. Names
and file labels are public metadata. Use maintained Node releases in production.

Windows/Linux/macOS runtime, security regression, contract, TypeScript, archive and
consumer checks form the technical release evidence. Six pinned public templates
were evaluated. External developer feedback is not yet collected; no adoption,
independent audit or full dotenv compatibility is claimed. Feedback is welcome
after release; security reports must use the private channel in SECURITY.md.
