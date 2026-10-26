# Developer validation before v1.0.0

Status: **Pending — Requires Human Participation**. The owner will distribute the
[developer trial instructions](DEVELOPER_TRIAL.md) after developers consent. Six public-template evaluations
are recorded separately; no user interviews, successful adoptions or retention
claims are made from those results. Do not contact people on the owner's behalf
without explicit authorization.

External feedback is a post-release improvement activity, not a mandatory launch
blocker. The owner accepted this uncertainty when approving v1.0.0. Automated
compatibility/security checks are evidence of technical behavior, not human adoption.
The earlier private trial archive remains a historical validation build; use the
released version for new trials once publication is verified.

Recruit 3–5 consenting developers across a Node service, frontend app and CI workflow.
Give them a reviewed source commit or local archive including the unreleased fixes,
the README, and a short synthetic starter fixture. Do not ask for their real .env
files, values, screenshots, process environment or private deployment credentials.

For a consenting private technical reviewer with the source checkout and Git/npm,
`npm run --silent candidate:verify -- /absolute/path/to/candidate` produces a
value-free receipt for the exact supplied archive. Follow [TESTING.md](TESTING.md#private-candidate-acceptance)
and retain the receipt privately. This automated rehearsal helps validate the
installation path; it does not count as a human usability trial or full OS matrix.

Ask each participant to:

1. Install the exact supplied archive and run help/version, recording Node/OS/commit.
2. Complete a clean check and intentionally remove/add/duplicate synthetic variables.
3. Interpret one syntax error and a skipped comparison without facilitator guidance.
4. Integrate JSON/exit handling into a disposable CI example or project script.
5. Explain whether externally provisioned/optional variables create unhelpful warnings.

Record only consented, sanitized observations using this template:

| Field                                                      | Observation |
| ---------------------------------------------------------- | ----------- |
| Anonymous trial ID / date                                  | Pending     |
| Runtime / OS / ConfigPilot commit                          | Pending     |
| Workflow and loader convention                             | Pending     |
| Time to first successful check (target under five minutes) | Pending     |
| Findings correctly understood without help                 | Pending     |
| False positives or misleading recommendations              | Pending     |
| CI status/JSON integration result                          | Pending     |
| Useful enough to keep? Why?                                | Pending     |
| Follow-up issue / decision                                 | Pending     |

Keep detailed security reports private per SECURITY.md. Seek specific corrective
feedback rather than positive testimonials. Review every blocker before API freeze;
record intentional limitations and reasons for accepting nonblocking feedback.
Stars/downloads and an engineering checklist cannot replace these observations.

After trials, summarize participant count, workflow diversity, actual setup times,
interpretation failures, warning noise and fixes. Do not mark this gate complete
until evidence exists. Review feedback as it arrives and prioritize correctness, security and usability fixes.
