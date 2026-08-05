## Context

The project has a GitHub Pages workflow (`pages.yml`) that:
1. Builds the HTML Antora site to `public/docs/`
2. Builds PDFs via `antora-playbook-pdf.yml` (intermediate HTML goes to `public/pdf/`)
3. Copies selected PDFs from `build/assembler/pdf/` to `public/pdf/`
4. Deploys everything in `public/` to GitHub Pages

Two bugs exist:
- `requirements.pdf` is linked from the docs but never copied (only `architecture.pdf` and `test-plan.pdf` are copied)
- The PDF playbook's `output.dir: ./public/pdf` puts intermediate HTML site files into the deployed directory

## Goals / Non-Goals

**Goals:**
- All 3 PDFs linked from the docs site are deployed (`requirements.pdf`, `architecture.pdf`, `test-plan.pdf`)
- The `public/pdf/` directory contains only PDF files and a clean index, not intermediate HTML site artifacts

**Non-Goals:**
- Changing which PDFs are generated (13 exist; we only deploy the 3 linked ones)
- Adding PDF links to the landing page
- Changing the assembler profile configuration
- Modifying the local build workflow

## Decisions

### Decision 1: Change PDF playbook `output.dir` to `./build/pdf-output`

The `@antora/pdf-extension` writes intermediate HTML to the configured `output.dir`. Currently `./public/pdf` mixes HTML artifacts with deployed PDFs. Moving to `./build/pdf-output` keeps the public directory clean.

**Alternative considered**: Keep `./public/pdf` but `.gitignore` the HTML artifacts. Rejected because GitHub Pages deploys from `public/` — gitignore doesn't help.

The `build/` directory is already gitignored and used by the assembler (`build/assembler/pdf/`), so this is consistent.

### Decision 2: Add `requirements.pdf` to CI copy step

One-line addition to `pages.yml`. The spec already says 3 PDFs should be copied; the implementation was simply missing one. No design trade-off.

### Decision 3: CI doesn't need path changes beyond the output dir

The CI copies PDFs from `build/assembler/pdf/tracer/${version}/_exports/` — this is the `@antora/pdf-extension` assembler output, not the `output.dir`. So changing the playbook's `output.dir` doesn't affect the CI copy step's source paths.

## Risks / Trade-offs

- [Low] If `@antora/pdf-extension` changes its assembler output path, the CI copy step would break. → Mitigation: the extension is a dev dependency with a locked version.
- [None] No behavioral change to the extension, site content, or CLI.
