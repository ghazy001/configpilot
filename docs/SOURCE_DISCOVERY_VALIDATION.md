# Source discovery validation — 2026-10-26

Read-only trials on selected public source files, with generated synthetic placeholders
created only in temporary evaluation copies. No project dependency installation,
build, server or scanned source execution occurred. This is not a complete repository,
framework certification, production benchmark or external developer trial.

| Project            | Files | References | Elapsed ms | Max RSS MiB | CLI/generation result         |
| ------------------ | ----- | ---------- | ---------- | ----------- | ----------------------------- |
| Node               | 1     | 1          | 152.19     | 67.63       | template/local/check passed   |
| Express            | 1     | 0          | 117.44     | 66.19       | no variables; no file created |
| Vite               | 1     | 0          | 125.95     | 69.11       | no variables; no file created |
| Next.js            | 2     | 1          | 116.94     | 67.3        | template/local/check passed   |
| TypeScript backend | 2     | 1          | 93.59      | 66.81       | template/local/check passed   |

Node 20.20.0, macOS arm64; one isolated process per probe, worker startup included.
Generated output had empty values except fixed PORT=3000; examples with zero keys
created no file. Source/default literals were not copied. All observed references
matched the expected inventory: Node PORT, Next NEXT_PUBLIC_API_URL, NestJS PORT;
Express/Vite selected starter files had none. Zero observed false positives/negatives
applies only to this tiny direct-reference inventory, not indirect/dataflow patterns.
See source-discovery-validation.json for pinned commits, exact file lists and bytes.

Findings: Next's JSX in .js initially failed; enabling JSX in JavaScript fixed it
with a regression. NestJS controller decorators initially failed; legacy decorator
parsing fixed it with a regression. The original Microsoft TypeScript starter URL
returned 404, so the maintained NestJS starter was selected instead. An older Next
environment-variables example no longer existed, so with-docker-multi-env was used.
Only source files were fetched, never the examples' environment files.

Sources:

- [heroku/node-js-getting-started at 8b8dec11](https://github.com/heroku/node-js-getting-started/tree/8b8dec11fcf027522a857e0c831ee01b7124f673)
- [expressjs/express at 1c6f1b0f](https://github.com/expressjs/express/tree/1c6f1b0fe4000977b9a7b4f34097e4d527dd9824)
- [vitejs/vite at e954a9cd](https://github.com/vitejs/vite/tree/e954a9cda0b5254be495a937333a0be1b8503d8f)
- [vercel/next.js at 7748e532](https://github.com/vercel/next.js/tree/7748e532a1abeb4387a722b0f1665bd53218f51a)
- [nestjs/typescript-starter at 0b6d7126](https://github.com/nestjs/typescript-starter/tree/0b6d71261ba30bb6976949a8653e4a86479a68c1)

Reproduce after fetching those pinned source files into disposable directories and
preparing a manifest with kind/root/repository/commit/files:

```sh
node scripts/validate-discovery-corpus.js /absolute/path/to/manifest.json
```

The helper asserts expected direct key sets and creates/removes only its generated
.env/.env.example in the explicitly selected temporary copies. Do not point it at
an application with existing configuration. Existing files are refused, not replaced.

Outstanding: manual Windows Terminal/PowerShell/iTerm2 rendering, complete repository
trials, broader source patterns and consenting developer feedback. No new Windows
hosted CI was run because this task explicitly prohibits pushing changes. Existing
release CI is historical evidence only. Linux/Windows remain pending for this feature.
