# Security policy

## Report a vulnerability

Do not post vulnerability details, exploit steps, credentials, or configuration
contents in public issues, pull requests, comments, or CI logs.

Use the repository's [Security page](https://github.com/ghazy001/configpilot/security)
and select **Report a vulnerability** if private reporting is available. If the
button is unavailable, open an [issue](https://github.com/ghazy001/configpilot/issues)
with only the title **Request private security contact** and ask for a private
channel. Include no technical vulnerability details or sensitive attachments in
that public request. Creating this policy alone does not enable private reporting;
see [GitHub's reporting guidance](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately).

Once a private channel is established, provide the affected commit/version, runtime
and OS, impact, and minimal reproduction with synthetic data. Coordinate disclosure
and a fix with the maintainer before sharing exploit details publicly. This project
does not currently promise a response deadline, bounty, or dedicated security team.

## Supported code

There are no published releases from this project yet. The current development
line on `main` is the review target; package metadata `0.1.0` is not a released
version or a promise of long-term support. A version support policy must accompany
the first approved release. Runtime compatibility is Node.js 20+ and ESM, with
tested combinations documented in the repository's
[testing guide](https://github.com/ghazy001/configpilot/blob/main/docs/TESTING.md).

## Data handling

ConfigPilot is designed to analyze declarations without retaining assignment values:

- The parser and analyzer take explicit strings. They do not read files, inspect
  `process.env`, load project modules, log input, or make network requests.
- The CLI reads only the selected configuration inputs in read-only mode. It never
  executes their contents, automatically rewrites files, sends data over the network,
  or creates temporary configuration copies.
- Reports contain key names, caller-provided file labels, line locations, fixed
  diagnostic text, status, and counts. Values and raw invalid source lines are absent
  from diagnostics, JSON/terminal reports, and controlled error messages.
- Operational CLI errors omit native messages, input paths, arbitrary arguments,
  and exception stacks. Terminal labels escape control and format characters;
  JSON preserves the original label after parsing.
- Inputs are bounded: the CLI permits 1 MiB per regular UTF-8 file; the parser API
  permits 1,048,576 UTF-16 code units per source. Unsupported quoted multiline
  blocks are quarantined, and parser errors suppress key-set differences.

See the [CLI](docs/CLI.md), [parser](docs/PARSER.md), and [report](docs/REPORT.md)
contracts for exact behavior and error handling. Regression tests exercise synthetic
tokens, passwords, connection strings, multiline credentials, and malformed input.
These are engineered boundaries and tested behavior, not a security certification.

## Boundaries and limitations

Key names and file labels are **public metadata**, not secret-scanned. Never encode
credentials in either. Do not pass secrets as command arguments: the operating
system and shell may retain arguments independently of ConfigPilot. Review reports
for sensitive names/paths before sharing them.

ConfigPilot is not a secret scanner, value validator, environment loader, or a
complete dotenv implementation. It does not establish that a deployment works.
Empty values count as declarations; interpolation is not expanded. Physical
multiline values are unsupported. Conservative recovery may suppress later keys;
inspect parser issues before relying on results.

Selected symlinks to regular files are followed; the caller chooses the paths and
must have permission to read their targets. Reads are not atomic snapshots of
concurrently edited files. The library caller controls file decoding, input-size
checks before allocation, output storage, and downstream logging. ConfigPilot does
not protect against hostile code already executing in the same Node process, OS
access to process memory, or independent npm/editor/shell behavior.

If a real credential is exposed outside these boundaries, follow your credential
provider's revocation process and your organization's incident procedure. Do not
send the credential to this project as evidence.

## Packaging and publication

The runtime has no dependencies. Development dependencies are lockfile-pinned.
An exact package allowlist and archive/consumer tests prevent unintended files from
being silently shipped; environment files, tests, and source-checkout examples are
excluded. The package stays `private` pending readiness review and explicit owner
approval. No release tag, npm publication, or external release is authorized by
this security policy. Registry name ownership and publishing credentials still
require verification before release.
