## Context

The `split-pdf-documents` change produces 8 PDFs in `build/assembler/pdf/` via `root_level: 1`. Only 3 (requirements, architecture, test-plan) are needed for public download. Currently PDF generation requires Ruby + devbox and is only run locally. The Pages workflow deploys the HTML site to GitHub Pages.

## Goals / Non-Goals

**Goals:**
- Generate and deploy the 3 core PDFs on every push to main
- Add download links from the published site
- Keep CI build time increase minimal

**Non-Goals:**
- Deploying all 8 PDFs (overview, user-guide, etc. — not needed)
- PDF generation on PR builds (only on main push to pages)

## Decisions

### 1. Manual PDF copy over publish: true

**Decision**: Keep `publish: false` in the assembler config and copy specific PDFs from the build directory to `public/pdf/` in the CI step.

**Rationale**: With `root_level: 1`, 8 PDFs are generated. Only 3 are wanted. Manual copy gives full control over file naming and selection without changing the assembler config.

### 2. ruby/setup-ruby action

**Decision**: Use `ruby/setup-ruby@v1` with `bundler-cache: true` to install Ruby and gems.

**Rationale**: Standard GitHub Actions approach. Caches gems between runs for faster builds. The project already has a `Gemfile` and `Gemfile.lock`.

### 3. PDF links in index.adoc

**Decision**: Add a "Downloads" section to the example site's index page with `link:` macros pointing to the PDF files.

**Rationale**: `link:` is the standard AsciiDoc way to create download links to non-AsciiDoc files. The index page already has a "What's Here" section listing the documents — adding download links there is natural.

## Risks / Trade-offs

- **Kroki.io availability**: PDF build requires network access for diagram rendering. → GitHub Actions runners have internet access; acceptable.
- **Build time**: PDF generation adds ~60s to the pages workflow. → Acceptable; the workflow already takes ~2 minutes.
- **Ruby version drift**: The `Gemfile.lock` must stay in sync with the Ruby version in CI. → Using `ruby/setup-ruby` with a version constraint handles this.
