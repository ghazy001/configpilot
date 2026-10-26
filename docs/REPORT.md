# Configuration comparison and report schema

`analyzeConfig` compares explicit template and environment strings using the
[documented dotenv parser](PARSER.md). It performs no filesystem, network, process
environment, or project-code access. It never decodes, compares, or returns values.

```js
import { analyzeConfig, ISSUE_CODES } from "configpilot";

const report = analyzeConfig({
  template: "DATABASE_URL=example\nPORT=3000",
  environment: "PORT=4000\nREDIS_URL=example",
});

console.log(report.comparison); // complete
console.log(report.summary.warnings); // 2
console.log(report.issues[0].code === ISSUE_CODES.MISSING_KEY); // true
```

This is the JavaScript API available from the checkout or a locally installed
archive. The [`configpilot check` command](CLI.md) provides terminal and JSON
reports using this same schema. Reports can also be serialized directly using
`JSON.stringify(report)`.

## Inputs

Pass one non-null object (not an array) with these fields:

| Field             | Type                      | Meaning                                       |
| ----------------- | ------------------------- | --------------------------------------------- |
| `template`        | required string           | Reference dotenv text. Empty text is allowed. |
| `environment`     | required string           | Actual dotenv text. Empty text is allowed.    |
| `templateFile`    | optional non-empty string | Location label; default `.env.example`.       |
| `environmentFile` | optional non-empty string | Location label; default `.env`.               |

Labels are metadata, never paths to read or normalize. Identical labels are allowed;
every issue also has an explicit source role. Other fields are ignored. Strings
are not coerced; Buffers are rejected. Missing required strings or invalid argument
types/labels throw a `TypeError` with fixed text that does not echo values. Each
source is independently subject to the parser's limit of 1,048,576 UTF-16 code units;
exceeding it throws `RangeError`. Original source strings and caller objects are
not retained in reports or exception causes.

## Comparison semantics

- Names are case-sensitive. Empty values count as declarations. Changes in value
  content do not affect findings when declaration syntax stays valid.
- Each distinct key is counted once per input. Duplicate declarations remain
  warnings and do not block comparison. Difference locations point to the first
  valid occurrence; duplicate locations point to each repeated occurrence and
  reference the first valid one via `relatedLocation`.
- `MISSING_KEY` means a template key has no declaration in the environment text.
  It is a **warning**, because the variable may be supplied through a deployment
  platform or another external source. It does not prove the application is broken.
- `UNDOCUMENTED_KEY` is a **warning** for an environment key absent from the template.
  It may be intentional. Document it or review its purpose before changing files.
- The tool does not inspect `process.env`, project source code, frameworks, or
  deployment systems. No assertion is made about runtime availability, requiredness,
  value validity, template completeness, or whether a declared variable is used.

If either parser returns an error (`INVALID_DECLARATION` or
`UNSUPPORTED_MULTILINE`), **all key differences are skipped**. Parser recovery can
suppress declarations, so comparing those partial sets could create false missing
or undocumented findings. The report retains all parser issues from both inputs,
adds one informational `COMPARISON_SKIPPED` issue, and sets `comparison` to `skipped`.
Resolve the input errors and rerun to obtain trustworthy differences. Skipped
comparison counts are `null`, not zero. This conservative policy trades partial
results for avoiding misleading diagnoses. There is no override in this milestone.

## Schema version 1

`schemaVersion` versions the report shape independently of the npm package version.
The result for the opening example is:

```json
{
  "schemaVersion": 1,
  "comparison": "complete",
  "issues": [
    {
      "code": "MISSING_KEY",
      "severity": "warning",
      "message": "Template variable has no declaration in the environment input. It may be supplied externally.",
      "recommendation": "Provide this key locally or through the deployment environment. Verify external provisioning before changing files.",
      "location": { "file": ".env.example", "line": 1 },
      "source": "template",
      "key": "DATABASE_URL"
    },
    {
      "code": "UNDOCUMENTED_KEY",
      "severity": "warning",
      "message": "Environment variable is not documented in the reference template.",
      "recommendation": "Document this key in the reference template if intentional, or review whether it is still needed.",
      "location": { "file": ".env", "line": 2 },
      "source": "environment",
      "key": "REDIS_URL"
    }
  ],
  "summary": {
    "errors": 0,
    "warnings": 2,
    "info": 0,
    "total": 2,
    "templateKeys": 2,
    "environmentKeys": 2,
    "sharedKeys": 1,
    "missingKeys": 1,
    "undocumentedKeys": 1
  }
}
```

The issue fields are:

| Field                       | Contract                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `code`                      | Stable code from the table below; also exported in the frozen `ISSUE_CODES` object.                         |
| `severity`                  | `error`, `warning`, or `info`.                                                                              |
| `message`, `recommendation` | Fixed explanation and suggested action; neither interpolates source text.                                   |
| `source`                    | `template`, `environment`, or `comparison`. This is a role, never raw source text.                          |
| `location`                  | `{ file, line }` with a one-based line number for file-associated issues. Omitted for `COMPARISON_SKIPPED`. |
| `key`                       | Included only for duplicates, missing keys, and undocumented keys.                                          |
| `relatedLocation`           | Included only for duplicates; points to the first valid occurrence in the same input.                       |

Issues sort by severity (`error`, `warning`, `info`), then source (`template`,
`environment`, `comparison`), then ascending line number. Remaining ties retain
insertion order. Sorting does not depend on locale, filenames, or operating system.
`parseDotenv` itself continues to return issues in source order without a `source`
role; its existing result shape and messages are preserved.

Summary severity counts include every issue, including `COMPARISON_SKIPPED`.
`total` equals `issues.length`. `templateKeys` and `environmentKeys` are counts of
distinct accepted keys; they are **partial** when parsing had errors. `sharedKeys`,
`missingKeys`, and `undocumentedKeys` are nonnegative integers when comparison is
complete and `null` when skipped. A complete comparison with no issues means the
supported key sets match; it is not a deployment-health assessment.

## Stable diagnostic codes

| Code                    | Severity  | Source        | Interpretation                                                                                                                    |
| ----------------------- | --------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_DECLARATION`   | `error`   | Input role    | Invalid syntax for the supported grammar, NUL, or an unclosed quote. Fix the declaration and review conservative parser recovery. |
| `UNSUPPORTED_MULTILINE` | `error`   | Input role    | Physical multiline quoted value cannot be analyzed. Use a supported representation or exclude the input.                          |
| `DUPLICATE_KEY`         | `warning` | Input role    | Multiple valid declarations for one name. Keep one to avoid loader-dependent overrides.                                           |
| `MISSING_KEY`           | `warning` | `template`    | No declaration in the environment text. Provide locally or verify external provisioning.                                          |
| `UNDOCUMENTED_KEY`      | `warning` | `environment` | No documentation in the template. Document intentional keys or review their purpose.                                              |
| `COMPARISON_SKIPPED`    | `info`    | `comparison`  | Input errors prevent trustworthy differences. Resolve errors and rerun. No location or key is invented.                           |

Existing parser codes, severity, and text remain unchanged. `ISSUE_CODES` maps each
code name to the same string and cannot be mutated. No severity overrides, runtime
variable resolution, policy files, or automatic configuration rewriting are included.

## Privacy boundaries

Reports contain only names, public file labels, locations, fixed diagnostic text,
status, and counts. Values, raw lines, and the original input object are absent
from serialization and inspection output. Secret-bearing quoted multiline bodies
are skipped by the parser, including malformed assignments. Names and labels are
public metadata; do not encode credentials in them. ConfigPilot is not a secret
scanner. It never transmits contents or modifies configuration files.

## Compatibility policy for the stable API

The named runtime exports remain `parseDotenv`, `analyzeConfig`, and `ISSUE_CODES`.
Calls stay synchronous and side-effect free. Inputs are explicit primitive strings;
unknown options remain ignored. Results are fresh mutable objects with no cross-call
state. Internal modules and reporters are not public exports. ESM is the supported
module format; CommonJS callers may use dynamic import. A synchronous CJS build is
not promised.

`schemaVersion: 1` already versions analysis and CLI error shapes separately from
the npm version. The shipped JSON Schema 2020-12 structural contract is exported as
`configpilot/schema.json`. For Node consumers, locate it with
`createRequire(import.meta.url).resolve("configpilot/schema.json")` and read it as
JSON; no runtime validator dependency is required. A validator may use its
`$defs.complete`, `$defs.skipped`, or `$defs.operational` definitions separately.
Summary arithmetic, ordering and exactly one comparison-skipped finding remain
semantic invariants verified by tests, beyond JSON Schema's structural checks.

For schema 1, existing fields, nullability, code meanings, severities and deterministic
ordering are compatibility guarantees. New fields/codes require an explicit schema
review; do not silently add them to schema 1's closed shapes. Human explanation and
recommendation wording may improve without a schema change; consumers must use codes
and fields rather than scrape prose. Stable v1 changes follow Semantic Versioning;
breaking changes need a major package version and, for changed report structures or
semantics, a new schema version. Pre-1.0 changes must still be documented.

Input type errors throw fixed-message `TypeError`; source/resource/label limits
throw fixed-message `RangeError`. Configuration syntax produces findings, not
exceptions. See [parser resource budgets](PARSER.md#resource-budgets). The CLI adds
`INPUT_LIMIT_EXCEEDED` to its operational envelope; it is not an analysis issue code.
The current checkout's additions are unreleased and do not retroactively change the
published 0.1.0 archive.
