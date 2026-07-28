## Why

The example site currently only produces HTML output. Contributors and users evaluating the project want a downloadable PDF version of the traceability documentation — requirements, architecture, and test plan — for offline reading and sharing. Adding PDF output demonstrates the extension works in multi-format documentation pipelines.

## What Changes

- Add devbox.json with Ruby + Node.js for reproducible PDF build environment
- Add Gemfile with `asciidoctor-pdf` gem (Ruby-based PDF converter)
- Add `@antora/pdf-extension` as a dev dependency in package.json
- Create `antora-playbook-pdf.yml` — a separate Antora playbook for PDF generation
- The PDF playbook uses the same content sources as the HTML site but outputs to `public/pdf/`

## Capabilities

### New Capabilities

- `pdf-output`: Generate a PDF version of the self-traceability example site using Antora's PDF extension with asciidoctor-pdf. Includes a reproducible devbox shell for contributors.

### Modified Capabilities

_None._ This is purely additive — existing HTML site generation is unchanged.

## Impact

- **Dependencies**: New dev dependencies: `@antora/pdf-extension` (npm), `asciidoctor-pdf` (Ruby gem), Ruby runtime
- **Dev tooling**: `devbox.json` gains `ruby` and `bundler` packages; init hook runs `bundle install`
- **Build artifacts**: New `antora-playbook-pdf.yml` playbook, new `Gemfile` and `Gemfile.lock`
- **Output**: PDF output lands in `public/pdf/` (not committed, gitignored)
- **No changes** to source code, existing playbook, or HTML site build
