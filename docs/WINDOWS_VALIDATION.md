# Private Windows validation runbook

Status: hosted Windows matrix passed in private run **40305989425** at source
**f3c9916**. See PROGRESS.md for executed results. The manual commands below are
an optional reproduction route; they have not themselves been run on Windows.
Keep source, logs and receipts private.

Use a disposable Windows workspace with Git and official Node/npm installations.
Do not mount application secrets or run the suite in an existing application.
Use the owner's reviewed source bundle and candidate directory; do not substitute
the published npm 0.1.0 package. This candidate retains that version text for
validation only and must never be published.

## Checkout and identity

From the unpacked private handoff directory in PowerShell:

```powershell
git -c core.autocrlf=false clone .\source.bundle .\source
if ($LASTEXITCODE -ne 0) { throw 'Clone failed' }
Set-Location .\source
git checkout f3c99164f9a3479d90908a00353a545d92451475
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
$candidate = (Resolve-Path ..\candidate).Path
git status --short
node -p "JSON.stringify({node:process.version,platform:process.platform,arch:process.arch})"
```

The source contains implementation commit
`6e827ae7af1cfa01c008084133dff531351adcc5`; subsequent commits changed unshipped
documentation only. The candidate verifier binds shipped bytes to that implementation.

## Runtime matrix

Repeat under Node **20.19.0, 22.13.0, 24.22.1 and 26.12.1**, confirming the active
version with `node --version` each time. Use `npm.cmd` to avoid PowerShell script
execution-policy differences. Install development dependencies separately on
Windows; do not copy macOS/Linux node_modules. Network is needed for installation
only; acceptance installs the local archive offline with lifecycle scripts disabled.

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed' }
npm.cmd run check
if ($LASTEXITCODE -ne 0) { throw 'Quality checks failed' }
npm.cmd run test:coverage
if ($LASTEXITCODE -ne 0) { throw 'Coverage failed' }
$receipt = npm.cmd run --silent candidate:verify -- "$candidate"
if ($LASTEXITCODE -ne 0) { throw 'Candidate acceptance failed' }
$receipt | Set-Content -Encoding utf8 "..\verification-windows-$((node --version)).json"
git status --short
```

Under minimum Node **20.0.0**, run `npm.cmd test` and the same candidate verification;
do not run the newer development tooling. Check `$LASTEXITCODE` after each command.

Retain runtime/OS/architecture, commit, command exit statuses, test totals, named
skips, core coverage, TypeScript results and candidate receipts. POSIX permission,
device and FIFO tests legitimately skip on Windows; symlink creation may require
privileges. Investigate other skips. The installed `.cmd` shim, spaces/Unicode paths,
CLI exits 0/1/2, UTF-8 handling, private API imports and installed-byte equality must
pass. Do not weaken assertions to obtain a green run. Return results through the
owner's private channel, without personal paths or environment contents.

Windows verification closes only this platform gate. It does not count as developer
feedback, authorize publication or establish Linux x64 compatibility.
