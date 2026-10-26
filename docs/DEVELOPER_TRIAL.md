# ConfigPilot developer trial

Thank you for trying ConfigPilot v1.0.0. Participation is voluntary. Share only
sanitized observations with the maintainer privately; never send real environment
files, credentials, process-environment dumps or screenshots containing secrets.
You may stop at any time. The released package is open source under the MIT license.

Use published **configpilot@1.0.0** for new trials. The earlier supplied private
0.1.0-text archive was a historical validation build; do not substitute it or the
older public 0.1.0 release. No developer trial has yet been recorded.

## Setup

Use a new disposable folder outside an application, with Node 20+ and npm. Record
your Node version, OS and architecture. In that folder, install the released package:

```sh
npm init -y
npm install --save-dev configpilot@1.0.0
```

Invoke `./node_modules/.bin/configpilot` on macOS/Linux, or
`.\node_modules\.bin\configpilot.cmd` in Windows PowerShell. Use `--help` first.
Read the installed `node_modules/configpilot/README.md` when needed. Record the time
from starting setup to your first successful check, including any confusing steps.

Create two UTF-8 files manually using synthetic values only:

`.env.example`:

```dotenv
PORT=3000
API_TOKEN=placeholder
```

`.env`:

```dotenv
export PORT=4000
API_TOKEN="synthetic-only"
```

## Tasks

1. Run a check and explain what its result establishes about your application.
2. Remove API_TOKEN from the environment file, add EXTRA=example and duplicate PORT.
   Explain each finding and the next action you would take.
3. Add a line containing only `BROKEN`. Explain whether differences can still be
   trusted and how to restore a complete comparison.
4. Request JSON output. Integrate the exit status into a disposable project script
   or CI example. Explain how you distinguish findings from a missing input file.
5. Consider an application where API_TOKEN is supplied by deployment infrastructure.
   Does the tool's explanation help? Is its warning/exit behavior useful or noisy?
6. In a disposable synthetic example resembling your usual project's conventions,
   try quoting/export/optional-variable patterns you actually use. Note unsupported
   syntax and false positives. Do not copy actual credentials into this trial.

Use the README/help without facilitator coaching first. Record where you needed
help; this is feedback about the tool, not a test of your ability.

## Feedback to return privately

- Anonymous trial ID, date and consent to retain sanitized feedback.
- Package version, Node version, OS/architecture and workflow (frontend/service/CI).
- Time to first check and any installation problem.
- Your interpretation of each task; any misleading diagnosis or recommendation.
- JSON/exit integration outcome and any unexpected result.
- Loader convention and synthetic syntax that caused false positives.
- Would you keep using this tool? Why or why not? Most valuable improvement?

Do not attach environment files or full logs. If you find a security issue, contact
the maintainer privately before sharing a reproduction. The maintainer records
aggregate results in VALIDATION.md only after the trials actually occur.
