# Usage examples

These examples run from the source checkout on Node.js 20+ without a build or
dependency installation. The `.txt` fixtures contain only synthetic values; their
extension is intentional, and ConfigPilot accepts any regular UTF-8 filename.

## Review a realistic mismatch

From the repository root:

```sh
node bin/configpilot.js check --template examples/reference.txt --env examples/environment.txt
node bin/configpilot.js check --template examples/reference.txt --env examples/environment.txt --json
```

Each command exits **1** with a complete comparison: `DATABASE_URL` is missing,
`REDIS_URL` is undocumented, and `PORT` is shared. There are 0 errors and 2 warnings.
The terminal output in the [README](../README.md#try-it-in-one-minute) is captured
from this exact command. Neither command modifies the inputs.

For a clean comparison, select the reference twice:

```sh
node bin/configpilot.js check --template examples/reference.txt --env examples/reference.txt --json
```

This exits **0** with no issues, 2 shared keys, and zero missing/undocumented keys.
Different assignment values would not affect key presence. These fixtures are for
demonstration, not deployment configuration or suggested production credentials.

## Read files as a library caller

```sh
node examples/analyze.mjs
```

[analyze.mjs](analyze.mjs) reads the two fixtures using URLs relative to its own
location, calls the public `analyzeConfig` export, and prints report schema 1.
It also works from another directory when invoked by absolute path. File reading
is explicit caller code; the analyzer itself has no filesystem access.

The report equals the mismatch CLI JSON report, but the script exits **0** after
producing it. Library callers choose their own process status. A caller applying
the CLI review policy can inspect `report.summary.errors` and
`report.summary.warnings`; check `report.comparison` before relying on differences.
Do not log the original strings or caller I/O exceptions containing sensitive data.

## Three practical workflows

### Joining a project

After following that project's setup instructions, select its reference and local
file explicitly. From the project directory, use your installed CLI:

```sh
configpilot check --template .env.example --env .env.local
```

Review warnings with the project's documentation. ConfigPilot never creates missing
files, fetches credentials, or decides whether a variable is externally provisioned.

### Maintaining a template

When a change adds environment variables, compare your maintained template with
a representative local file. Missing keys prompt a provisioning check; undocumented
keys prompt a template review. Duplicate findings point to both assignments.
The tool does not scan source references or prove that a key is used by the app.
Keep template values synthetic and never commit actual local credentials.

### Adding a pipeline check

Install the locally built archive as a development dependency as described in the
[README](../README.md#install-locally), then add a script to the consumer's package:

```json
{
  "scripts": {
    "config:check": "configpilot check --template .env.example --env .env.ci --json"
  }
}
```

This fragment belongs in the consumer project, not ConfigPilot's own package.
Run `npm run config:check`; provision both selected regular files before the step.
Use synthetic templates or securely supplied inputs according to the project's
own policy. Do not print inputs to diagnose the check.

Exit 0 means clean analysis, 1 means findings to review, and 2 means an operational
failure. Many CI runners fail on either nonzero status. npm may add script banners;
when another program needs exactly one JSON object, invoke the executable directly
or use `npm run --silent config:check` and preserve the process status. Do not hide
operational errors by blindly appending a success command or ignoring stderr.
Review key names and path labels before storing reports as artifacts.

For direct library integration, use the parsed result object rather than scraping
terminal output. There is no built-in deployment adapter, policy file, warning-only
flag, or automatic multi-environment comparison. See [the CLI reference](../docs/CLI.md),
[report schema](../docs/REPORT.md), and [troubleshooting](../docs/TROUBLESHOOTING.md).
