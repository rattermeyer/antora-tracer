## Why

The PDF and DOCX assembler extensions (`antora-pdf-extension.cjs`, `antora-docx-extension.cjs`, `antora-docx-converter.cjs`, `adoc-to-docx`) currently live at the project root and are not published to npm. Any site that installs `antora-tracer` and wants PDF or DOCX output must copy these files manually from the GitHub repository. This is undiscoverable and fragile — it means the npm package is incomplete for its primary use case of generating regulatory-ready documentation.

## What Changes

- Move PDF and DOCX extension files from the project root into `src/` so they are compiled/copied to `lib/src/` and published
- Add `exports` entries in `package.json` so consumers can reference extensions by package name (e.g., `require: antora-tracer/antora-pdf`)
- Promote `@antora/assembler` and `@antora/pdf-extension` from `devDependencies` to `peerDependencies` — consumers must install them, but the package declares the dependency contract
- Move the `adoc-to-docx` wrapper script and assembler config YMLs into `examples/` — they are consumer-side configuration, not library code
- Update all playbook `require:` paths and assembler `command:` paths to reflect new locations
- Update the how-to guide for PDF and DOCX to document the new `require` pattern

## Capabilities

### New Capabilities

- `published-extensions`: PDF and DOCX Antora extensions are published as part of the `antora-tracer` npm package and referenceable by package name

### Modified Capabilities

- `pdf-output`: Extension is now published and referenced via `antora-tracer/antora-pdf`; assembler configs and `adoc-to-docx` move to consumer-side (examples)
- `docx-output`: Same pattern — extension published as `antora-tracer/antora-docx`; assembler configs and script move to consumer-side

## Impact

- `package.json`: new `exports` entries, `peerDependencies` for `@antora/assembler` and `@antora/pdf-extension`
- `src/`: 3 new files (`antora-pdf-extension.cjs`, `antora-docx-extension.cjs`, `antora-docx-converter.cjs`) — kept as `.cjs` (not TypeScript), copied by `scripts/build.js`
- `scripts/build.js`: copy `.cjs` files alongside templates/presets
- Root: remove `antora-pdf-extension.cjs`, `antora-docx-extension.cjs`, `antora-docx-converter.cjs`, `adoc-to-docx`, all `antora-assembler-*.yml`
- `examples/`: add `adoc-to-docx` and `antora-assembler-*.yml` as reference configuration
- `antora-playbook-pdf.yml`: update `require:` paths
- Docs (`how-to/generate-pdf.adoc`, `how-to/generate-docx.adoc`): update install and playbook instructions
