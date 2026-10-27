# Project rules, workspaces and automation (v1.3.0)

Available in ConfigPilot 1.3.0. Install with `npm install --save-dev configpilot`
or `npm install --global configpilot`. Existing commands without the new options
preserve their reports and exit policy.

## Explicit project rules

Create `configpilot.config.json` manually:

```json
{
  "schemaVersion": 1,
  "rules": {
    "requiredKeys": ["API_TOKEN"],
    "optionalKeys": ["DEBUG_LEVEL"],
    "externalKeys": ["DEPLOYMENT_ID"],
    "ignore": ["**/*.test.*", "generated/**"],
    "severity": {
      "SOURCE_UNDOCUMENTED_KEY": "warning",
      "SOURCE_MISSING_LOCAL_KEY": "error"
    },
    "failOn": "warning"
  }
}
```

```sh
configpilot scan --config configpilot.config.json
configpilot check --config configpilot.config.json
configpilot init --config configpilot.config.json --dry-run
```

Selection is always explicit: ConfigPilot never searches for or imports project
configuration code. Only bounded UTF-8 JSON inside cwd, without symlink traversal,
is accepted. JavaScript configuration, plugins and executable callbacks are unsupported.
Unknown fields, unsupported versions, overlapping key categories and invalid names
are rejected with sanitized errors. Use key names only; never put credentials here.
Configuration contains no values, defaults or expressions to execute.

- `optionalKeys`: a missing local declaration remains visible as informational.
- `externalKeys`: a missing local declaration remains informational; ConfigPilot
  does not read process.env or verify deployment provisioning. Template documentation
  is still checked, even for external/optional variables.
- `requiredKeys`: explicitly require a nonblank local declaration, including keys
  not referenced in source. They are included in init placeholders. Missing keys
  produce REQUIRED_KEY; blank assignments produce EMPTY_REQUIRED_KEY.
- `ignore`: source traversal only. Slash paths support `*` within a segment and `**`
  as a whole segment; no regex, shell expansion, question-mark or gitignore negation
  syntax. Leading `./` path segments are normalized; negated patterns are rejected. `generated/**` excludes that directory and its contents. Existing default
  dependency/generated/hidden exclusions and resource limits remain in force.
- `severity`: only the codes enumerated in config.schema.json may be changed to
  `off`, `info`, `warning` or `error`. Syntax/parse/incomplete/resource findings cannot
  be disabled or downgraded. Suppressed check findings remain in the original analysis.
  Check uses MISSING_KEY/UNDOCUMENTED_KEY/DUPLICATE_KEY; scan uses SOURCE_* codes.
  REQUIRED_KEY and EMPTY_REQUIRED_KEY are shared across both.
- `failOn`: `warning` (default), `error`, or `never`. Informational findings do not
  fail the command. Confirmed syntax errors always fail; incomplete scan always exits 1.
  `never` does not bypass incomplete parsing or operational errors. Init success
  means safe creation, not policy compliance: review/fill placeholders and run check.

Required-value checks use the existing dotenv parser and its quote quarantine.
Only accepted key names, locations and blank/nonblank booleans leave internal parsing.
Unquoted comments/whitespace and empty/whitespace-only quoted strings count as blank.
Escapes, interpolation and runtime values are not evaluated: `KEY="\\n"` is a nonblank
literal for this check. Duplicate declarations are still diagnosed; the last accepted
assignment determines blankness. Any syntax error skips required-value assertions,
because the declarations are not trustworthy. Validity, format, password strength,
network access and application readiness are not checked. Actual values never enter
reports, exceptions, terminal output, annotations or generated content.

`check --config ... --json` returns a separate policy-check report with schemaVersion 1,
original `analysis`, effective `issues`, severity `summary` and `failed`. The ordinary
check JSON schema and ISSUE_CODES catalog remain unchanged. Scan retains its discovery
kind and adds optional `policy` metadata and per-variable `configurationRole`.
In scan reports, policy.failed describes the finding threshold; complete:false independently fails the command.
Default check: 0 clean, 1 findings, 2 operational. Configured check: 0 policy passes,
1 policy/syntax fails, 2 operational. Configured scan: 0 complete and policy passes,
1 incomplete/policy fails, 2 operational. Neither mode claims external keys exist.

## Preview template additions

```sh
configpilot scan --template-diff
configpilot scan --template-diff --template .env.sample --json
configpilot scan --config configpilot.config.json --template-diff
```

This is a read-only preview: copy chosen assignments manually into your template.
Only missing source/explicit-required key names are suggested. Ordering is stable,
duplicates are removed and every suggested assignment is empty (including PORT).
Existing template/local values and hardcoded source fallbacks are never copied.
There is no patch application, overwrite or automatic .gitignore modification.
Missing templates are normal and produce a preview of all named configurable keys.
Incomplete discovery refuses an authoritative additions preview (exit 2).
With rules, the original scan's policy failure still determines exit 1.

## Vue single-file components

`.vue` files are parsed with pinned official @vue/compiler-sfc 3.5.44, loaded only
inside the bounded parser worker when a Vue file is encountered. See the
[official SFC specification](https://vuejs.org/api/sfc-spec) for the format. No component,
framework compiler plugins, project dependencies, preprocessors or imports execute.
This adds a runtime dependency graph to obtain reliable SFC boundaries; regular
check/startup does not load the Vue compiler. Babel still handles embedded JS ASTs.

Supported: one inline `<script>` or `<script setup>` block with JavaScript,
TypeScript, JSX or TSX. References retain original component file/physical line
locations, including CRLF inputs. Comments, unrelated strings and shadowed process
bindings are handled by the existing lexical analysis. External src scripts,
unsupported languages, dual normal/setup script blocks and malformed components
produce explicit incomplete scans and prevent initialization.

Ordinary template markup is parsed, but template expressions are not analyzed as
independent JavaScript: Vue bindings/directive scopes can change their meaning.
A component containing template expressions produces an explicit unresolved-reference
notice, with no guessed template names. Init warns that unresolved lookups were
omitted. Review these templates manually. This is script-block support, not full
Vue/Nuxt compatibility. Svelte/Astro components remain explicitly unsupported.

## Independent workspaces

Add an explicit list to the same JSON file:

```json
{
  "schemaVersion": 1,
  "rules": { "optionalKeys": ["DEBUG_LEVEL"] },
  "workspaces": [
    { "name": "web", "root": "apps/web", "path": "src" },
    {
      "name": "api",
      "root": "apps/api",
      "template": ".env.example",
      "environment": ".env",
      "rules": { "requiredKeys": ["DATABASE_URL"] }
    }
  ]
}
```

```sh
configpilot scan --config configpilot.config.json --workspaces
configpilot check --config configpilot.config.json --workspaces --json
configpilot scan --config configpilot.config.json --workspaces --template-diff
configpilot init --config configpilot.config.json --workspace api --dry-run
configpilot init --config configpilot.config.json --workspace api
configpilot check --config configpilot.config.json --workspace api
```

Workspaces are named explicit directories inside cwd, not package-manager glob
expansion or package manifest execution. Duplicate/overlapping roots, traversal,
external drives and symlinks are rejected. Source and selected configuration stay
inside each root. Unselected roots are not opened. Source path and configuration
paths are relative to each selected root; explicit CLI paths override workspace
settings. Init's destination remains one root-level filename inside that chosen root.
Custom workspace template/env selections apply to scan/check; use init --output
explicitly to create a custom filename. Continue using the same project selections
for subsequent commands so rules and roots are retained.

Workspace rule fields override inherited fields; severity entries merge. Clear an
inherited key list explicitly before moving a key to another category. Aggregates
are sorted by name. --workspaces is read-only (check/scan/preview); multi-file init
is deliberately rejected. Every creation still requires confirmation or --yes and
uses exclusive creation. Existing files remain protected.

Aggregate JSON has kind workspaces with command and entries containing name, root,
exitCode and report. Reports stay independent; no combined environment key set exists.
Aggregate exit is the highest workspace exit (0/1/2). Invalid root/configuration
selection can abort before a result; no aggregate operation writes files.
A single workspace uses its ordinary report kind. Maximum 16 nonoverlapping roots.
Scans share the existing total file/entry/byte/reference/finding and 30-second budgets;
these limits are not multiplied by workspace count. Aggregates cap findings at 8192
and output at 4 MiB. Check processes selected files sequentially, with existing per-input
bounds. Large monorepos can explicitly select a smaller workspace/scope.

## GitHub annotations

```sh
configpilot scan --config configpilot.config.json --github
configpilot check --config configpilot.config.json --workspaces --github
```

--github is explicit, supports check/scan only and is exclusive with --json. It emits
GitHub Actions workflow commands without headers, colors or prompts; use it in your
own existing Actions job. It does not send anything to GitHub by itself. Exit codes
are unchanged. Annotations contain stable codes, accepted key names and safe relative
locations, with workspace prefixes. They deliberately omit arbitrary messages/source
text and values. Unsafe absolute/traversing/control-containing locations are omitted.
Workflow metacharacters are escaped and output is capped at 200 findings plus an
omission notice. A clean report emits a notice. Keep --json for complete reports.
Protocol reference: [GitHub workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands).

## Public APIs and JSON Schemas

```js
import { analyzeConfigWithRules, previewTemplateUpdates } from "configpilot";

const result = analyzeConfigWithRules(
  { template: "API_TOKEN=", environment: "API_TOKEN=" },
  { requiredKeys: ["API_TOKEN"], failOn: "error" },
);
// result.failed === true; no assignment value is included.
```

analyzeConfigWithRules(input, rules?) is pure. It preserves the original analysis
under analysis and returns effective policy issues/counts separately. Bad rules
throw a safe Error with PROJECT_CONFIG_INVALID; existing analyzer input errors remain.
scanProject accepts optional rules with the same semantics. No config file is loaded
implicitly by either API. scanSource remains synchronous JS/TS/JSX/TSX extraction;
Vue file discovery is supported through scanProject's isolated worker.

previewTemplateUpdates(discovery, {requiredKeys?, templateKeys?}) is pure and requires
complete discovery. Pass the complete selected template key inventory if explicit
required names are not in source, so already-documented required keys are excluded.
The CLI does this automatically. No filesystem creation is involved. The existing
parseDotenv/analyzeConfig results and all previous exports remain compatible.

JSON Schema Draft 2020-12 exports (no runtime validator dependency):

| Export                                 | Contract                                                     |
| -------------------------------------- | ------------------------------------------------------------ |
| configpilot/schema.json                | Existing check report/error, unchanged                       |
| configpilot/discovery.schema.json      | Discovery and discovery operational errors                   |
| configpilot/initialization.schema.json | Initialization and discovery errors                          |
| configpilot/project.schema.json        | Policy check, template preview, workspace and project errors |
| configpilot/config.schema.json         | Explicit project JSON configuration                          |

Register all schemas by their urn $id with your validator before compiling project
schema, which references the existing report/discovery contracts. Schemas reject
unknown fields, including value/source/snippet fields. Semantic invariants (matching
summary counts, unique/contained workspace roots, disjoint rule lists and aggregate
budgets) are also enforced/tested in code. TypeScript declarations cover both new APIs.
