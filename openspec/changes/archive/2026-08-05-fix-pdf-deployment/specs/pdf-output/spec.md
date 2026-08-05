## MODIFIED Requirements

### Requirement: PDF playbook generates PDF from example site
A separate `antora-playbook-pdf.yml` SHALL exist that uses `@antora/pdf-extension` to generate PDFs from the example site's content. The playbook SHALL use the same content sources as the HTML playbook but output intermediate HTML to `./build/pdf-output/`, not `./public/pdf/`.

#### Scenario: Running the PDF playbook produces PDFs
- **WHEN** `npx antora antora-playbook-pdf.yml` runs in the project root
- **THEN** PDF files are produced in `build/assembler/pdf/` by the assembler
- **AND** intermediate HTML site files are written to `build/pdf-output/`
- **AND** no files are written to `public/pdf/` by the playbook

#### Scenario: HTML playbook is unchanged
- **WHEN** `npx antora antora-playbook.yml` runs
- **THEN** HTML output is produced in `public/docs/` as before
- **AND** no PDF-related warnings appear in the output
