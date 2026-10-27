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

Security reports are accepted for v1.0.0 and current main. Upgrade from 0.1.0
for the privacy and resource-handling fixes described in the changelog. The newest
stable minor line receives security fixes; older lines may require upgrading.
Compatibility/security changes are recorded rather than replacing a published
archive. We do not promise a response deadline or long-term pre-1.0 support.

Runtime compatibility remains Node.js 20+ and ESM. For production, use a maintained
Node release; Node 20 is upstream EOL. The project keeps its compatibility floor
until an explicitly reviewed decision changes it. See the
[official schedule](https://nodejs.org/en/about/previous-releases) and repository
[testing guide](https://github.com/ghazy001/configpilot/blob/main/docs/TESTING.md).

## Data handling

ConfigPilot is designed to analyze declarations without retaining assignment values:

- The parser and analyzer take explicit strings. They do not read files, inspect
  `process.env`, load project modules, log input, or make network requests.
- The check CLI reads only the selected configuration inputs in read-only mode. It never
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

Source discovery uses the pinned @babel/parser runtime dependency and its locked
transitive type-support packages. Development dependencies are lockfile-pinned.
An exact package allowlist and archive/consumer tests prevent unintended files from
being silently shipped; environment files, tests, and source-checkout examples are
excluded. The package has explicit public-registry metadata. Candidate preparation
never publishes. Publication, new tags and external releases always need explicit
owner approval for an exact new version/artifact. A published name/version must never
be reused for changed bytes. Manual owner-controlled 2FA publication is supported;
trusted publishing/provenance requires a separate reviewed setup.

## Source discovery and explicitly authorized initialization (v1.2.0)

Scan reads bounded JS/TS/JSX/TSX, never loads project modules/config/plugins, and
returns only portable names and public locations. Workers bound parser heap/time;
parse failures discard raw exceptions and do not recover speculative keys. Fallback
literals are not retained or copied. Directory/file links are skipped or refused.
Selected dotenv inputs use no-follow reads; check's documented symlink policy is unchanged.
No network transmission is performed. Git-ignore inspection invokes only native
Git check-ignore with fsmonitor/hooks disabled, not scanned scripts or project commands.

Init is the explicit exception to read-only operation: after confirmation or --yes
it creates one nonexistent root-level file with exclusive creation and mode 0600.
It cannot overwrite or automatically edit .gitignore. It never stages/commits/pushes.
Generated content is safe placeholders only; credentials must be supplied privately.
The programmatic createEnvFile caller must obtain consent before passing confirmed:true.
Concurrent hostile replacement of ancestor directories and Windows ACL policy are
outside portable Node path guarantees; root identity is checked before creation.
Write errors may leave a partial new file; errors request manual inspection and never
delete a path that could have been replaced. See SOURCE_DISCOVERY.md in docs for bounds.

## Deep feature audit — 2026-10-27

Discovery workers receive no process environment and no inherited startup arguments.
Only static portable keys/locations leave the AST; unknown expressions/object escapes
are unresolved. Source/template/local key union is retained only for CLI generation,
never values. All .env variants except explicit example/sample templates keep private
Git-ignore warnings even when --template is supplied. Tracked files cannot be declared
safely ignored using no-index. Existing-file checks happen before scans; exclusive
creation and an opened-descriptor regular-file check remain mandatory.

Confirmation defaults No on EOF, interruption, output failure and idle timeout. Known
CI indicators prevent interactive prompts. Windows console names and C1 controls are
rejected on all platforms as a conservative policy; current native Windows CI
evidence is recorded in the release progress log. A write failure may leave a partial new file, and cannot be reported as success.
No confirmed value-disclosure vulnerability was reproduced; this is maintainer review,
not an independent security certification. Audit evidence is retained in repository
FEATURE_QUALITY_AUDIT.md; it is not part of the npm archive.

Guarded discovery reads use BigInt file IDs. On Windows, volume serials are
normalized to libuv's 32-bit policy. When an older Windows path-stat reports no
volume serial, a second descriptor verifies device/inode identity and the named
regular file is rechecked before and after verification. Device/inode mismatches
remain failures; this does not add atomic protection against hostile parent-directory
mutation beyond portable Node filesystem guarantees.
