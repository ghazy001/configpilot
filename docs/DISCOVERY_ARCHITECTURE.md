# Source discovery and initialization architecture

Status: implemented and locally verified; existing check API/schema remains independent.

- `discovery/source.js`: pure AST extraction and deterministic name-based classification.
  JavaScript/TypeScript/JSX/TSX only; no project compiler/plugins/config are loaded.
  Babel 7 is selected for Node 20 compatibility and JS/TS grammar support. This
  introduces a small parser dependency graph rather than a full TypeScript compiler.
- `discovery/project.js`: bounded sorted traversal, selected dotenv key parsing and
  source/template/local comparison. Only root `.env.example` (fallback `.env.sample`)
  and `.env` are read automatically. Other recognized files are listed, not read.
  `--path` chooses source scope; configuration/output remain rooted at cwd.
- `initialization/template.js`: pure deterministic placeholder generation. Never
  retains fallback literals. Only discovered PORT/NODE_ENV receive fixed development
  placeholders; credentials and unknowns are empty. Built-in bundler flags are omitted.
- `initialization/create.js`: explicit confirmed creation with exclusive `wx`, mode
  0600, root-directory-only destinations, symlink checks and Git ignore inspection.
  No parent-directory creation, overwrites, gitignore edits or staging. Git ignore
  checks invoke only Git's check-ignore, with hooks/fsmonitor disabled, never project
  scripts. No reliable ignore result means a warning, not an assurance.
- `discovery/cli.js`: scan/init arguments and orchestration. `reporters/discovery.js`
  renders scan/init using the shared terminal writer. CLI readline
  confirmation is injected; `--yes` authorizes creation only. Existing check remains
  unchanged. Reuse escaped labels, stream capabilities and responsive terminal writer.

Onboarding: `scan`, `init --template`, `init`, then `check`. Both generations require
explicit consent. Key-presence success does not validate empty placeholder values.
The `.env.sample` discovery fallback does not change check defaults. Recommend
creating `.env.example`, or explicit check paths for custom selected/output files.
New discovery results have their own schemaVersion 1 plus kind discriminator; the
existing check schema and ISSUE_CODES stay unchanged. Static references prove use,
not requiredness. Missing local keys are informational, never definite errors.

Bounds: 1000 source files, 5000 directory entries, depth 32, 256 KiB/source,
8 MiB total source, 4096 references, 8192 diagnostics and 256 KiB generated content.
Skip symlinks and excluded trees; refuse initialization after incomplete scanning.
No source snippets, expression text, literal values or native exceptions leave AST
extraction. Portable names only; invalid computed strings are unresolved, not echoed.
Lexical binding analysis handles process imports, local shadows, immutable aliases
and static destructuring without running code. Unknown object escapes remain explicit.
Parser workers have empty environments and no inherited Node startup arguments.
Vue/Svelte/Astro components report incomplete scans rather than silent exclusion.
No component parsing, Nuxt runtime-config inference, full flow analysis or complete
framework support is claimed. CLI-only scanProjectContext retains selected key sets
privately for init; public scanProject report shape is unchanged. Generation merges
selected names without values. Explicit confirmation handles EOF/timeout/output errors;
CI never prompts. New discovery reporter separates rendering from orchestration.

Portability: root-level output avoids directory symlink traversal; exclusive creation
protects existing entries and concurrent creators. Node path APIs cannot make parent
replacement races impossible: concurrent hostile modification of the project root is
outside the supported boundary. Fail closed if root realpath/identity changes before
creation. POSIX mode is restrictive; Windows ACLs remain inherited.
