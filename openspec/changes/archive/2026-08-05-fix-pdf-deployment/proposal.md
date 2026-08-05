## Why

The GitHub Pages deployment copies only 2 of 3 linked PDFs (`requirements.pdf` is missing), and the PDF playbook outputs intermediate HTML to `public/pdf/`, polluting the deployed PDF directory with HTML site assets.

## What Changes

- Add missing `requirements.pdf` to the CI copy step so all 3 linked PDFs are deployed
- Change the PDF playbook `output.dir` from `./public/pdf` to a non-deployment directory (`./build/pdf-output`) so intermediate HTML doesn't mix with deployed PDFs
- Update the CI workflow to use the new output path

## Capabilities

### New Capabilities

None — this is a bug fix within existing capabilities.

### Modified Capabilities

- `pdf-output`: Change the PDF playbook output directory from `./public/pdf` to `./build/pdf-output` so intermediate HTML files are not deployed

## Impact

- `antora-playbook-pdf.yml`: change `output.dir`
- `.github/workflows/pages.yml`: add missing `requirements.pdf` copy, update PDF source path if needed
- No API, CLI, or extension changes
