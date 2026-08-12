## Context

The `antora-tracer` npm package currently ships the core traceability extension (`lib/src/antora-extension.js`) but not the PDF or DOCX assembler extensions. These live as hand-authored `.cjs` files at the project root alongside 10 assembler config YMLs and a shell script. They are excluded from the npm `files` list, so consumers who want PDF or DOCX output must find and copy these files manually from the GitHub repository.

Additionally, `@antora/assembler` and `@antora/pdf-extension` are listed as `devDependencies`, meaning npm does not signal to consumers that these are required for PDF/DOCX functionality.

Current root clutter: `antora-pdf-extension.cjs`, `antora-docx-extension.cjs`, `antora-docx-converter.cjs`, `adoc-to-docx`, `antora-assembler-pdf*.yml` (×5), `antora-assembler-docx*.yml` (×5).

## Goals / Non-Goals

**Goals:**
- Publish PDF and DOCX Antora extensions as part of the `antora-tracer` npm package
- Enable consumers to reference extensions by package name in their playbooks
- Declare `@antora/assembler` and `@antora/pdf-extension` as `peerDependencies`
- Relocate example-site-specific assembler configs and scripts to `examples/`
- Clean the project root of extension clutter

**Non-Goals:**
- Shipping assembler config YMLs in the npm package — these are consumer-side configuration
- Shipping `adoc-to-docx` in the npm package — it is a platform-specific shell script consumers adapt
- Converting the `.cjs` extension files to TypeScript — they depend on CJS-only packages and are stable

## Decisions

### `.cjs` files stay as-is, copied by the build script

The PDF and DOCX extension files use `require()` for CJS-only Antora packages (`@antora/assembler`, `@antora/pdf-extension`). The project uses `"type": "module"` so hand-authored `.cjs` files are the correct format. Converting to `.cts` TypeScript would add noise for no benefit — the files are small and stable.

**Decision**: Move `.cjs` files from root to `src/`, copy them to `lib/src/` in `scripts/build.js` alongside templates and presets. Add them to `package.json` `files` and `exports`.

Alternative considered: Write as `.cts` TypeScript. Rejected — adds build complexity (separate `tsconfig` exclusions), these files have no types to enforce.

### `peerDependencies` for assembler packages

`@antora/assembler` and `@antora/pdf-extension` are required at runtime for PDF/DOCX output but are optional — not every consumer uses these features. `peerDependencies` is the correct npm signal: "if you use this feature, install these".

**Decision**: Move both to `peerDependencies` with `optional: true` in `peerDependenciesMeta`. Consumers who want PDF/DOCX must `npm install @antora/assembler @antora/pdf-extension`.

Alternative: Keep as `devDependencies`. Rejected — consumers get no signal from npm about what to install.

### Assembler configs and `adoc-to-docx` move to `examples/`

These are project-specific consumer configuration, not library code. The library ships the extension modules; the consumer provides the assembler configs that define their document structure and profiles. Shipping example configs in the npm package would impose the example site's document model on all consumers.

**Decision**: Move to `examples/` as reference configuration. Document in how-to guides what a consumer needs to create in their own project. Reference them by relative path from the project root in playbooks (they're local to the project, not npm-resolved).

Alternative: Ship sample configs in npm package. Rejected — imposes opinionated document structure on consumers.

### Export names

Use short, predictable subpath exports:
- `antora-tracer/antora-pdf` → `lib/src/antora-pdf-extension.cjs`
- `antora-tracer/antora-docx` → `lib/src/antora-docx-extension.cjs`

These match the Antora convention of referencing extensions by npm package subpath.

## Risks / Trade-offs

**Breaking change for existing local users** → Any project referencing `./antora-pdf-extension.cjs` or `./antora-docx-extension.cjs` by local path must update to the package subpath export. Mitigated by documenting in CHANGELOG and updating the example site's own playbooks.

**peerDependencies require manual install** → Consumers must explicitly `npm install @antora/assembler @antora/pdf-extension`. Mitigated by clear documentation in how-to guides and a postinstall warning if peers are missing (optional).

**adoc-to-docx is shell-specific** → Consumers on Windows cannot use the shell script directly. Mitigated by documenting alternatives (WSL, devbox, Docker). This is a pre-existing constraint.

## Migration Plan

1. Move `.cjs` files: root → `src/`
2. Update `scripts/build.js` to copy `.cjs` files to `lib/src/`
3. Update `package.json`: `files`, `exports`, `peerDependencies`
4. Move assembler configs and `adoc-to-docx`: root → `examples/`
5. Update `antora-playbook-pdf.yml` require paths and assembler config paths
6. Update how-to docs
7. Test: `npm pack --dry-run` to confirm published file set

Rollback: The change is self-contained. Reverting means moving files back and restoring `package.json`. No database or API changes.
