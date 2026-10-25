# Dotenv parser API and syntax

`parseDotenv(source, options?)` is a synchronous, deterministic, presence-only
parser. It reads text supplied by the caller and returns names and locations.
It never reads files, changes `process.env`, executes input, expands references,
modifies files, logs input, or sends data over the network. It has no dependencies.

```js
import { parseDotenv } from "configpilot";

const result = parseDotenv("PORT=3000\nPORT=4000", { file: ".env" });
// result.declarations:
// [
//   { key: "PORT", location: { file: ".env", line: 1 } },
//   { key: "PORT", location: { file: ".env", line: 2 } }
// ]
// result.issues[0].code === "DUPLICATE_KEY"
// result.issues[0].relatedLocation: { file: ".env", line: 1 }
```

This API is available from the local checkout or a locally packed installation.
The project has not published this package to npm. Comparison and the
`configpilot check` command are not implemented yet.

## Inputs and results

`source` must be a primitive string. Buffers and other types are rejected rather
than coerced. Input is limited to **1,048,576 UTF-16 code units** (`source.length`),
including a possible initial BOM. This bounds parsing work; it is not a byte limit.
Read or decode files outside the parser. `options` must be a non-null object,
not an array. `options.file` is an optional non-empty string used only as a label,
defaulting to `<input>`. No filesystem checks or path normalization take place.
Other options are ignored.

The result has two arrays in source order:

- `declarations`: every valid occurrence as `{ key, location: { file, line } }`.
  Lines are numbered from 1. Duplicates are retained; no winning value is selected.
- `issues`: `{ code, severity, message, recommendation, location }`. Only duplicate
  issues additionally have `key` and `relatedLocation` (the first valid declaration).

No values, raw source lines, decoded strings, closures over input, or error causes
are retained in results. Names and caller-provided file labels are public metadata;
do not encode credentials in either. This is syntax recognition, not secret detection.
Empty values count as declarations; value contents and validity are not assessed.

Invalid argument types throw `TypeError`; excessive input throws `RangeError`.
Their messages are fixed and never interpolate arguments. Invalid configuration
syntax returns issues instead of throwing. An issue-free result means the supported
grammar matched; it does not establish that an application is configured correctly.

## Supported grammar

The supported subset uses the portable key naming rule documented by
[Node.js dotenv](https://nodejs.org/api/environment_variables.html#variable-names).
ConfigPilot defines the rest of its precise behavior below. Tests exercise this
contract; **full Node.js or dotenv package compatibility is not claimed**.

- Keys match `[A-Za-z_][A-Za-z0-9_]*` and are case-sensitive. Dots, hyphens,
  Unicode letters, leading digits, and whitespace inside keys are rejected.
- Each declaration uses `KEY=value`. A lowercase `export` prefix followed by
  spaces or tabs is optional; `export=value` declares the key `export`.
- Spaces and tabs may surround the declaration, key, equals sign, and value.
  Other characters are not treated as horizontal whitespace.
- Empty lines and lines starting with `#` after spaces/tabs are ignored.
  An initial UTF-8-decoded BOM (`U+FEFF`) is ignored only at the start of input.
- LF, CRLF, and lone CR line endings are recognized, including mixed endings.
- Unquoted values extend to the end of the line; `#` begins a comment. Additional
  equals signs, spaces, embedded quote characters, JSON, and Unicode text are
  treated as value content and discarded.
- Values starting with a single quote, double quote, or backtick must end with
  the same delimiter on that physical line. Inside any of these quote styles,
  backslash escapes the following character for delimiter detection. Paired
  backslashes therefore allow a following quote to close the value. The parser
  neither interprets nor returns escape sequences such as `\n` and `\t`.
- After a closing quote, only spaces/tabs and an optional `#` comment are allowed.
  Concatenated quoted segments, shell suffixes, and trailing text are rejected.
- NUL characters make a line invalid, including in comments.

Literal `${NAME}`, `$NAME`, and `$(command)` sequences are opaque value text.
They are never expanded or executed. ConfigPilot does not validate shell syntax,
resolve interpolation, decode values, or load the environment.

## Multiline handling and recovery

Physical multiline quoted values are unsupported. If an opening quote closes on
a later line, one `UNSUPPORTED_MULTILINE` issue is returned at the opening line.
If no matching closing delimiter is found, one `INVALID_DECLARATION` issue is
returned instead. No declaration is returned for the affected assignment.

All body lines and the entire closing line are skipped, even if they resemble
assignments or contain apparent comments. Quarantine also applies to unmatched
quotes in malformed declarations (for example, an invalid key followed by a
quoted credential). Those receive `INVALID_DECLARATION`. Without a closing
delimiter, the rest of the input is skipped. Otherwise parsing resumes on the
following line. If a malformed closing line opens another unmatched quote,
quarantine continues through that block as well. This conservative recovery can
suppress otherwise valid later declarations; review issues before using the
declaration list for comparison.

Ordinary malformed single lines do not stop later independent declarations.
Invalid declarations never participate in duplicate detection. Shell heredocs,
line continuations, and other loader-specific constructs have no special meaning;
they are outside this grammar. Use complete single-line dotenv declarations.

## Diagnostic codes

| Code                    | Severity  | Meaning and action                                                                                                                            |
| ----------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_DECLARATION`   | `error`   | A line does not match this grammar, contains NUL, or has an unclosed quote. Use a portable name, equals sign, and complete single-line value. |
| `UNSUPPORTED_MULTILINE` | `error`   | A quoted value spans physical lines. Use an escaped single-line representation understood by your loader, or exclude this input.              |
| `DUPLICATE_KEY`         | `warning` | A valid key occurs again. Keep one declaration to avoid loader-dependent overrides; the issue points to its first occurrence.                 |

These codes describe ConfigPilot's grammar. An unsupported construct may be valid
in another loader; an error does not prove a deployment is broken. Diagnostics
use fixed text and expose a key only for confirmed duplicate declarations.
