# Security policy

## Report a vulnerability

Do not post vulnerability details, exploit steps, credentials, or configuration
contents in public issues, pull requests, comments, or CI logs.

Private reporting is enabled for the upstream repository. Use
[Report a vulnerability](https://github.com/ghazy001/configpilot/security/advisories/new)
to submit privately. If the
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

The latest published package is 0.1.0. Security reports are accepted for that
release and current main. This checkout contains unreleased privacy/resource fixes;
registry installation does not include those fixes until a separately approved new
version is published. We do not promise a response deadline or long-term support for
older pre-1.0 versions. For v1, the newest stable minor line will receive security
fixes; older lines may require upgrading. Compatibility/security changes are recorded
in the changelog rather than changing an existing published archive.

Runtime compatibility remains Node.js 20+ and ESM. For production, use a maintained
Node release; Node 20 is upstream EOL. The project keeps its compatibility floor
until an explicitly reviewed decision changes it. See the
[official schedule](https://nodejs.org/en/about/previous-releases) and repository
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
  blocks and ambiguous quote boundaries are conservatively quarantined, and parser
  errors suppress key-set differences. Record and aggregate metadata budgets prevent
  unusually dense inputs from generating excessive reports.

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
excluded. The package has explicit public-registry metadata. Candidate preparation
never publishes. Publication, new tags and external releases always need explicit
owner approval for an exact new version/artifact. A published name/version must never
be reused for changed bytes. Manual owner-controlled 2FA publication is supported;
trusted publishing/provenance requires a separate reviewed setup.
