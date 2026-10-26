# Public-template evaluation — 2026-10-26

A bounded release-readiness exercise against three public, commit-pinned example
templates. These are reference examples, not production configurations. Upstream
projects were neither installed nor executed and do not endorse ConfigPilot.

## Source identity and results

| Public template at pinned commit                                                                                                                  | Bytes | Accepted unique keys | Parser issues | CLI self-comparison exit | Synthetic missing / undocumented |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | -------------------: | ------------: | -----------------------: | -------------------------------: |
| [calcom/cal.com — .env.example](https://github.com/calcom/cal.com/blob/0f19cc46ef6b6426ee398c670575b3c96be7af9e/.env.example)                     | 18061 |                  174 |             0 |                        0 |                            1 / 1 |
| [immich-app/immich — docker/example.env](https://github.com/immich-app/immich/blob/256eb55dbe92ac77e02794442f9487e88ffed2b1/docker/example.env)   |   979 |                    6 |             0 |                        0 |                            1 / 1 |
| [supabase/supabase — docker/.env.example](https://github.com/supabase/supabase/blob/478bd88d35e65c277e86c0f30b9a755851813303/docker/.env.example) | 12296 |                   71 |             0 |                        0 |                            1 / 1 |

Downloaded byte SHA-256 digests:

- calcom/cal.com: `77f42817ca80ef1f691f3213a9a0f5628aa7db848e119308a8c0914f38b8b0c4`.
- immich-app/immich: `dda820cecbcf5fd5d6afecc54107bbd3c973088c631d380dfc83e9f0f2c6b210`.
- supabase/supabase: `57f837916e1a6118468f08d23f051f28669e1ea0fcfde372e6e066073fe3e3a2`.

## Executed assertions

- Each public input parsed without diagnostics. An API self-comparison returned
  complete status, zero findings, all accepted keys shared, and numeric zero
  difference counts. Repeating the analysis returned deeply equal reports.
- The actual CLI ran from a separate temporary directory, with explicit paths
  selecting each downloaded example twice. Exit 0, empty stderr, and JSON equal
  to the API report were asserted. Input SHA-256 digests remained unchanged.
- Accepted key sets were rebuilt using synthetic values only. Equal synthetic
  inputs remained clean. Removing the first key and adding one reserved review
  key produced exactly one missing and one undocumented finding in each case.
  The serialized reports contained neither synthetic value marker.
- Reports were checked against all complete assignment-value strings of at least
  12 characters in the public samples: 23 for Cal.com, zero for Immich, and 36 for
  Supabase. None appeared. This check is not a general secret scanner; the regular
  synthetic security suite separately covers short and multiline credentials.
- No downloaded template, upstream source code, assignment value or native tool
  output containing values was added to Git or the npm distribution. Only source
  URLs, hashes, counts and method are recorded here.

## Reproduction and limits

Download each linked raw example at the exact commit into a temporary location,
verify its digest above, then run the checkout CLI with that file selected as both
template and environment:

```sh
node "/absolute/path/to/configpilot/bin/configpilot.js" check --template "/temporary/path/reference.txt" --env "/temporary/path/reference.txt" --json
```

Self-comparison is a clean-baseline assertion, not evidence that an upstream app
would run successfully. The synthetic variant deliberately tests presence changes;
it does not reproduce an actual configuration defect in an upstream project.
No statement is made about optional variables, runtime provisioning, value validity,
framework behavior, project startup, other commits or unsupported multiline syntax.

Directus was considered at commit b3ce03c18673230913bdfdf14907eb13e6865178,
but no .env.example/example.env candidate appeared in its inspected current tree.
It was excluded from the tested sample rather than reported as a pass.

The evaluation used ConfigPilot source commit
`3f5ca871e5261325328b6c3943887acdc52071ce`, Node.js v20.20.0 and macOS. The normal
runtime/platform matrix is separate evidence. Keep tests deterministic and offline;
these upstream downloads are a manual release review, not a network dependency
of package tests or analysis. Wider sampling and real maintainer feedback remain
necessary before making broad compatibility or product-adoption claims.

## Stability expansion — 2026-10-26

The current source was evaluated against six public templates with
`node scripts/evaluate-public-templates.js`. This manual command needs development
dependencies and network access; it is never invoked by the runtime or offline CI.
The [corpus manifest](public-template-corpus.json) pins every repository, source SHA,
path and content SHA-256. No raw template or upstream source is committed.

| Project  | Path                                | Bytes | Unique keys | Findings | CLI self-check |
| -------- | ----------------------------------- | ----: | ----------: | -------: | -------------: |
| Cal.com  | .env.example                        | 18061 |         174 |        0 |              0 |
| Immich   | docker/example.env                  |   979 |           6 |        0 |              0 |
| Supabase | docker/.env.example                 | 12296 |          71 |        0 |              0 |
| Outline  | .env.sample                         | 13438 |          87 |        0 |              0 |
| Twenty   | packages/twenty-server/.env.example |  6537 |           7 |        0 |              0 |
| Novu     | apps/human-dashboard/.env.example   |  1885 |           8 |        0 |              0 |

Every accepted key set matched pinned dotenv 18.0.9. Repeated API reports matched;
the actual CLI ran from a disposable directory; public input digests remained
unchanged. Each synthetic key-set reconstruction was clean; removing one key and
adding one yielded exactly one missing/undocumented warning, and adding one duplicate
yielded exactly one duplicate warning. Synthetic values stayed out of reports.
Downloads and temporary public input copies were deleted; upstream code was never
installed or executed. Only counts, identities and digests were logged.

The initially guessed Novu apps/api/.env.example path returned 404. Repository tree
inspection found the dashboard example above; the failed lookup is not counted as
passing. Empty/different/commented optional keys and loader layering remain outside
these checks. Six samples are compatibility evidence, not adoption evidence,
endorsement, deployment-health validation or full dotenv compatibility. See the
[developer trial protocol](VALIDATION.md) for the remaining feedback gate.
