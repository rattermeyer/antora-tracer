## ADDED Requirements

### Requirement: Pages workflow generates PDFs
The GitHub Pages workflow SHALL include Ruby setup and PDF generation steps so that requirements, architecture, and test-plan PDFs are built and deployed alongside the HTML site on every push to main.

#### Scenario: PDFs are deployed after push to main
- **WHEN** a commit is pushed to the `main` branch
- **THEN** the pages workflow installs Ruby and gems via `bundle install`
- **AND** runs `npx antora antora-playbook-pdf.yml`
- **AND** copies `requirements.pdf`, `architecture.pdf`, and `test-plan.pdf` into `public/pdf/`
- **AND** the PDFs are deployed to GitHub Pages

### Requirement: Site links to PDF downloads
The example site's index page SHALL include download links to the three core PDF documents.

#### Scenario: Index page shows PDF download links
- **WHEN** a visitor views the published site index page
- **THEN** they see a "Downloads" section with links to `pdf/requirements.pdf`, `pdf/architecture.pdf`, and `pdf/test-plan.pdf`

### Requirement: Local PDF workflow is unchanged
The existing local PDF build workflow (`devbox shell` + `npx antora antora-playbook-pdf.yml`) SHALL continue to work unchanged.

#### Scenario: Local PDF build still works
- **WHEN** a developer runs `devbox shell` followed by `npx antora antora-playbook-pdf.yml`
- **THEN** PDFs are generated in `build/assembler/pdf/` as before
- **AND** the assembler config uses `publish: false`
