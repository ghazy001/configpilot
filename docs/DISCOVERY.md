# Product discovery and initial evaluation

Review date: **2026-10-26**. This records the previously unfinished Milestone 0
desk research and a small public-template evaluation before first-release review.
It does not establish adoption, user satisfaction or full dotenv compatibility.

## User, problem and value

The primary persona is a JavaScript developer or open-source maintainer who needs
to review drift between a checked-in configuration template and one explicit local
input. A new contributor may not know which variables to provision; a maintainer
may have forgotten to document an added key; CI needs a deterministic review signal.

ConfigPilot provides explainable, presence-only diagnostics without returning
assignment values. It combines explicit source locations, stable codes, specific
recommendations, a simple CLI and a pure library API. That combination and its
documentation are the intended value proposition; no novel-category claim is made.

## Five competing tools

Capabilities below come from each project's primary documentation, reviewed on
the date above. This was a documentation review, not a comparative benchmark or
security audit, and does not claim these tools lack undocumented capabilities.

| Tool and primary source                                                | Main documented capability                                                                                     | Implication for ConfigPilot                                                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [dotenv](https://github.com/motdotla/dotenv#readme)                    | Loads values into process.env; exposes a value-returning parser and supports multiline values.                 | Keep analysis separate from loading; document our narrower grammar.                                         |
| [dotenv-safe](https://github.com/rolodato/dotenv-safe#readme)          | Checks required template keys against the loaded process environment, including externally provided variables. | Missing file declarations cannot prove deployment failure; retain warning severity and provisioning advice. |
| [envalid](https://github.com/af/envalid#readme)                        | Uses declared validators to check/coerce values and returns a typed immutable environment interface.           | Do not imply presence checks validate values or replace application schemas.                                |
| [dotenv-linter](https://github.com/dotenv-linter/dotenv-linter#readme) | Checks dotenv conventions, offers fixes and compares keys between files.                                       | Linting and key comparison already exist; keep ConfigPilot read-only and focus on explanations.             |
| [dotenv-diff](https://github.com/Chrilleweb/dotenv-diff#readme)        | Scans source references, detects configuration drift and framework misuse, and explains variables.             | Source scanning and explanations are not unique; avoid rebuilding framework analysis in v0.1.0.             |

The npm registry linked dotenv-diff 3.4.2 to Chrilleweb/dotenv-diff at review time;
the similarly named Python package is not the npm project evaluated here.

## v0.1.0 boundary

Included: the documented single-line dotenv subset; keys and source locations;
missing/undocumented/duplicate/syntax diagnostics; deterministic schema-version-1
reports; terminal/JSON CLI; explicit file selection; ESM API and declarations;
bounded input; stable exit codes; zero runtime dependencies.

Excluded: value correctness, deployment health, process.env merging, value loading,
physical multiline support, interpolation, source-code scanning, framework-specific
rules, multiple-environment matrices, severity policies, rewriting, telemetry and
external accounts for analysis. Existing established tools cover several of these.

## Realistic scenarios and example problems

1. A new contributor compares a template with local declarations. DATABASE_URL is
   absent locally; the recommendation asks them to verify external provisioning
   before adding it. No missing declaration is treated as proof of an outage.
2. A maintainer adds REDIS_URL locally but omits it from the template. CI reports an
   undocumented key and exits 1, prompting an intentional documentation decision.
3. A service template contains duplicate PORT assignments or an unclosed credential
   quote. Locations identify duplicates; syntax problems suppress differences until
   repaired, preventing misleading missing-key advice from incomplete input.

These scenarios are supported by executable synthetic examples and existing tests.
They are product assumptions, not quotations from user interviews.

## Evaluation method

Selected public reference templates from Cal.com, Immich and Supabase to sample a
large JavaScript app, a small deployment template and a service stack. Source commits,
paths and SHA-256 digests are recorded in [REAL_PROJECT_EVALUATION.md](REAL_PROJECT_EVALUATION.md).
Directus was considered but its current tree contained no .env.example/example.env
candidate; it was replaced rather than inventing a successful evaluation.

Only public example text was downloaded temporarily. No project dependencies were
installed and no upstream project/configuration code was executed. No raw templates
or values were added to this repository or package. The results document exact
counts, deterministic API behavior, actual CLI execution and controlled synthetic
drift using the accepted public key sets.

## Initial assumptions and unresolved evidence

- Developers will value explanations enough to add another tool to their workflow.
  No interview, adoption or retention evidence exists yet.
- Explicit two-file checks are a useful first boundary. Optional example variables
  and externally supplied values can create intentional warnings; policy controls
  and provisioning discovery remain out of scope.
- A conservative single-line subset is useful despite multiline limitations. The
  three samples are encouraging syntax evidence, not a representative ecosystem
  survey or proof that all templates work.
- Stable JSON and exit codes should support CI adoption, but real maintainer
  feedback must validate noise, wording and workflow fit after an approved release.
- Lightweight runtime dependencies and privacy boundaries matter, but no startup,
  performance-superiority or stronger-security-than-competitors claim is justified.

Review competitors again before later feature planning and seek feedback from
actual users. Track concrete reports rather than claiming validation from stars,
package downloads or completion of an engineering checklist.
