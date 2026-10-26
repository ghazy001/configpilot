# ConfigPilot v1.1.0

A clearer terminal experience for environment-configuration checks.

- Compact branding and selected input paths; friendly diagnostic titles, locations,
  stable issue codes and actionable recommendations.
- Stream-aware colors, Unicode/ASCII fallbacks and wrapping for narrow terminals.
- `--no-color` disables ANSI; `--quiet` keeps findings and silences clean checks;
  `--verbose` explains the safe analysis scope. Quiet and verbose are exclusive.
- JSON schema version 1, public JavaScript API, severities and exit codes stay unchanged.
- No runtime dependencies added. Values and raw source lines are never displayed.
- Fast ASCII wrapping handles maximum escaped labels; Unicode uses grapheme-aware wrapping.

Requires Node.js 20+. Upgrade with `npm install --save-dev configpilot@1.1.0`
or `npm install --global configpilot@1.1.0`. Scripts parsing terminal text should use
`--json`; human-readable formatting has changed. External developer feedback and
font-specific manual terminal validation remain uncollected.
