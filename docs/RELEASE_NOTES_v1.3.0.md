# ConfigPilot v1.3.0

- Explicit JSON project rules for optional, external and required local keys.
- Opt-in required-local blank checks and configurable CI severities/failure thresholds.
- Read-only previews of missing template assignments; no overwrites or copied values.
- Vue inline JS/TS/JSX/TSX script discovery using the official SFC parser.
- Explicit isolated workspace roots with shared resource budgets.
- GitHub Actions annotations, four exported JSON Schemas and two pure APIs:
  analyzeConfigWithRules and previewTemplateUpdates.

Existing default commands, API reports, JSON schema and exit codes remain compatible.
Vue templates stay unresolved; unsupported script combinations fail closed. No
runtime provisioning or credential validity is claimed. Node.js 20+ is required.

```sh
npm install --global configpilot@1.3.0
configpilot scan --template-diff
configpilot check --config configpilot.config.json
```

See docs/PROJECT_WORKFLOWS.md for policy configuration, workspaces, APIs and limits.
Publication requires successful native CI and exact archive acceptance.
