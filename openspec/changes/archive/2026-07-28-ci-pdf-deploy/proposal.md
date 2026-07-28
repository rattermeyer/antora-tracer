## Why

PDF output is currently only generated locally via devbox. Contributors and site visitors have no way to download PDF versions of the traceability documents. Adding PDF generation to the CI pages workflow and linking from the site makes the three core documents (requirements, architecture, test-plan) available as downloadable PDFs on every push to main.

## What Changes

- Add Ruby + bundler setup to the GitHub Pages workflow
- Add PDF build step (`npx antora antora-playbook-pdf.yml`) to the pages workflow
- Copy the 3 core PDFs (requirements, architecture, test-plan) from the build directory into `public/pdf/` for deployment
- Add "Downloads" section with PDF links to the example site's index page

## Capabilities

### New Capabilities

- `ci-pdf-deploy`: Generate and deploy PDF documents for requirements, architecture, and test-plan via GitHub Actions, with download links on the published site.

### Modified Capabilities

_None._

## Impact

- **CI workflow**: `.github/workflows/pages.yml` gains Ruby setup, bundle install, PDF build, and PDF copy steps
- **Site content**: `examples/modules/ROOT/pages/index.adoc` gains a "Downloads" section with PDF links
- **Build time**: Pages workflow increases by ~60s for PDF generation
- **No changes** to local dev workflow, HTML build, or source code
