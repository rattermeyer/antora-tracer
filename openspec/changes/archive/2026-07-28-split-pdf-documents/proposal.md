## Why

The current PDF generation produces a single 54-page PDF containing every page in the example site. Users want separate, focused PDFs for requirements, architecture, and test-plan — the three core traceability documents. A single monolithic PDF is harder to navigate and share for specific audiences (e.g., a stakeholder who only needs the requirements document).

## What Changes

- Split the single PDF output into three separate PDFs: `requirements.pdf`, `architecture.pdf`, `test-plan.pdf`
- Add assembler profiles in the component descriptor (`examples/antora.yml`) with dedicated nav files per document
- Create three assembler config files (one per profile) with shared build settings
- Create three nav files pointing to individual documents
- Register the PDF extension with `configFiles` pointing to all three configs
- The single-PDF playbook remains available via the existing `antora-assembler-pdf.yml`

## Capabilities

### New Capabilities

- `split-pdf-documents`: Generate separate PDFs per document (requirements, architecture, test-plan) using assembler profiles with custom navigation files. Each PDF contains only the pages relevant to that document.

### Modified Capabilities

_None._ The existing single-PDF output is preserved; the split is additive.

## Impact

- **Configuration**: New assembler config files (`antora-assembler-pdf-*.yml`), new nav files (`nav-*.adoc`), updated `examples/antora.yml` with `ext.assembler` profiles
- **Playbook**: `antora-playbook-pdf.yml` updated to use `configFiles` (plural) pointing to three configs
- **Output**: PDFs now land as `public/pdf/tracer/0.7.0/_exports/<profile>.pdf` instead of a single `index.pdf`
- **No changes** to source code, HTML site build, or existing `antora-assembler-pdf.yml`
