## Context

The example site (`examples/`) is built with Antora and outputs HTML to `public/docs/`. There is no PDF output. The `@antora/pdf-extension` npm package orchestrates PDF generation by merging pages via `@antora/assembler` and delegating to an external `asciidoctor-pdf` CLI (Ruby gem). Ruby is not currently part of the project's toolchain.

## Goals / Non-Goals

**Goals:**
- Generate a single PDF from the example site's AsciiDoc content
- Provide a reproducible dev environment via devbox.json
- Keep HTML site build unchanged (separate playbook)
- Use the officially recommended Ruby + asciidoctor-pdf path

**Non-Goals:**
- Custom PDF themes/styling (default theme is sufficient)
- PDF generation in CI (local use only for now)
- Offline diagram rendering (Kroki.io is fine)

## Decisions

### 1. Ruby + Bundler + Gemfile over AsciidoctorJ

**Decision**: Use Ruby with `asciidoctor-pdf` gem managed by Bundler.

**Rationale**: This is the officially recommended path in the Antora Assembler docs. `@antora/pdf-extension` is designed and tested against the `asciidoctor-pdf` CLI. AsciidoctorJ is available as a fallback but introduces uncertainty around CLI compatibility and Kroki integration for PDF output.

**Alternatives considered**:
- AsciidoctorJ: Available in nixpkgs, avoids Ruby, but `@antora/pdf-extension` expects `asciidoctor-pdf` CLI conventions
- asciidoctor-pdf npm (alpha): Pure JS but alpha quality, uses Puppeteer not CLI, incompatible with the PDF extension's assembler approach

### 2. Separate PDF playbook

**Decision**: Create `antora-playbook-pdf.yml` alongside the existing `antora-playbook.yml`.

**Rationale**: The PDF extension replaces the UI bundle (no HTML UI for PDF) and needs different `asciidoc.attributes` and output directory. Keeping it separate avoids conditional logic and keeps each playbook simple.

### 3. Devbox for reproducible toolchain

**Decision**: Update `devbox.json` with `ruby`, `bundler`, and `nodejs` packages. Init hook runs `npm install` and `bundle install`.

**Rationale**: The project already has a `devbox.json` (currently a bare template). Adding Ruby via devbox means contributors only need devbox installed — no system Ruby required. Non-devbox users can still install Ruby and run `bundle install && npm install` manually.

### 4. Kroki.io for diagram rendering

**Decision**: Use the public Kroki.io service for PlantUML diagram rendering in PDF output.

**Rationale**: The architecture.adoc has `[plantuml, format=svg]` blocks. `asciidoctor-pdf` supports kroki via `asciidoctor-kroki` gem. The `Gemfile` will include `asciidoctor-kroki` alongside `asciidoctor-pdf`.

## Risks / Trade-offs

- **Kroki.io availability**: PDF build requires network access to render diagrams. If offline, diagrams will be missing. → Acceptable for now; local Kroki can be added later.
- **PlantUML in PDF**: SVG diagrams may not render identically in PDF as in HTML. → Acceptable; diagrams are supplementary.
- **Ruby gem compilation**: Some environments may need build tools (gcc, make) for native gem extensions. → devbox provides these via nix packages.
