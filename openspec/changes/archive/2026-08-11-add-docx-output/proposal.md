## Why

Regulatory submissions in medical (IEC 62304) and other compliance-driven domains require documents in DOCX format for review, approval, and archiving. The project already generates PDFs via `@antora/pdf-extension` + asciidoctor-pdf; adding DOCX as an alternate output format enables the traceability extension to support the full regulatory documentation lifecycle from a single AsciiDoc source.

## What Changes

- New wrapper script `adoc-to-docx` that converts assembled AsciiDoc to DOCX via asciidoctor docbook backend + pandoc
- New assembler configs for DOCX output (one per document profile, mirroring existing PDF assembler configs)
- Updated `devbox.json` to include `pandoc` package
- Updated `antora-playbook-pdf.yml` (or new playbook variant) to include DOCX assembler configs
- Documentation: how-to guide for DOCX generation and reference entry in `reference/cli.adoc`

## Capabilities

### New Capabilities

- `docx-output`: Generate DOCX files from assembled AsciiDoc pages using the Antora assembler infrastructure, asciidoctor's docbook backend, and pandoc. Output format is suitable for regulatory submission workflows with cross-references, embedded images, and auto-generated tables of contents.

### Modified Capabilities

<!-- None: existing PDF output is untouched; DOCX is additive -->

## Impact

- **New file**: `adoc-to-docx` wrapper script (shell)
- **New files**: DOCX assembler configs (mirrors existing `antora-assembler-pdf*.yml`)
- **Modified**: `devbox.json` — add `pandoc` package
- **Modified**: `antora-playbook-pdf.yml` — add DOCX assembler extension configs (or new playbook)
- **New dependency**: `pandoc` (system package, already available in apt/brew/choco)
- **No npm dependency changes**: asciidoctor Ruby gems already present via bundler
- **No changes** to existing PDF pipeline, traceability extension, or matrix generation
