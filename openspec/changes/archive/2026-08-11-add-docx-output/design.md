## Context

The project currently generates PDF output from assembled AsciiDoc pages using the `@antora/pdf-extension` + asciidoctor-pdf. The assembler infrastructure (`@antora/assembler`) combines pages into a single AsciiDoc document, then invokes a `build.command` to convert it. For DOCX, we reuse the same assembler infrastructure but swap the converter: asciidoctor docbook backend → pandoc → DOCX.

The regulatory submission use case requires DOCX as the primary exchange format. The medical-iec62304 preset already ships with the project, making DOCX support a natural fit.

## Goals / Non-Goals

**Goals:**
- Generate DOCX files from the same assembled AsciiDoc sources used for PDF
- Reuse existing assembler configs (one DOCX per document profile)
- Produce DOCX with embedded images (Kroki diagrams as PNG), cross-references, and auto-generated TOC
- Keep the PDF pipeline completely unchanged

**Non-Goals:**
- Per-page DOCX output (DOCX is assembled, like PDF)
- Traceability matrix embedding in DOCX (matrices remain HTML attachments)
- PDF-to-DOCX feature parity (DOCX is a best-effort alternate format)
- pandoc reference-doc styling (out of scope for initial implementation, can be added later)

## Decisions

### Decision 1: asciidoctor docbook → pandoc pipeline over pandoc-direct

**Chosen**: Pipe assembled AsciiDoc through `asciidoctor -b docbook` then `pandoc -f docbook -t docx`.

**Rationale**: Pandoc's native AsciiDoc reader does not support Asciidoctor extensions (Kroki, custom macros). The docbook backend of asciidoctor handles all AsciiDoc features correctly, and pandoc's docbook→docx conversion is mature.

**Alternative considered**: Pandoc direct from AsciiDoc. Rejected — Kroki diagrams and custom macros would break.

### Decision 2: Wrapper script over custom Antora extension

**Chosen**: A shell wrapper script (`adoc-to-docx`) that the assembler invokes as `build.command`.

**Rationale**: The `@antora/assembler` already passes assembled AsciiDoc on stdin and expects output via `-o <path>`. A wrapper script intercepts these, runs the two-step pipeline, and writes the DOCX. No extension code needed — just a shell script and assembler configs.

**Alternative considered**: Custom Antora extension implementing the Converter interface. Rejected — over-engineered; the assembler's `command` key already supports arbitrary converters.

### Decision 3: Separate DOCX assembler configs, not inline in PDF configs

**Chosen**: Create `antora-assembler-docx*.yml` files mirroring the existing `antora-assembler-pdf*.yml` files.

**Rationale**: The PDF extension is registered separately in the playbook. Adding DOCX configs as additional extension instances keeps concerns separated and allows independent enable/disable.

### Decision 4: pandoc as devbox system package, not npm dependency

**Chosen**: Add `pandoc` to `devbox.json` packages.

**Rationale**: Pandoc is a system binary (Haskell), not a Node.js package. It's widely available in package managers and devbox handles it cleanly. No npm wrapper needed.

## Risks / Trade-offs

- **Code syntax highlighting**: Pandoc docbook→docx does not preserve Rouge/Pygments highlighting. Formatting degrades to monospace. → Acceptable for regulatory submissions where content fidelity matters more than syntax coloring.
- **Item block styling**: The custom `[#ID, item, role=X]` block styling is lost in docbook→docx. Items render as plain paragraphs. → Acceptable; the traceability block IDs and xrefs still work.
- **Traceability matrices**: Matrices are HTML attachments in the Antora site, not embedded in assembled AsciiDoc. They won't appear in DOCX. → Acceptable; matrices can be referenced by URL, and users needing them in DOCX can use the CSV export.
- **TOC requires F9 refresh**: Word auto-generates the TOC from heading styles but needs a manual refresh on open. → Acceptable; this is standard Word behavior.

## Open Questions

- Should DOCX be generated for ALL document profiles, or just a subset? → Generate for all profiles initially (architecture, requirements, use-cases, test-plan, full), matching PDF behavior.
- Reference-docx for styling? → Deferred. Standard pandoc styling is clean enough for regulatory review. Custom styling can be added later via pandoc's `--reference-doc`.
