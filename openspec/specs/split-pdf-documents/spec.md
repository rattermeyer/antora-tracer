## ADDED Requirements

### Requirement: Assembler profiles produce separate PDFs per document
The component descriptor SHALL define assembler profiles with dedicated nav files so that the assembler produces separate PDFs for requirements, architecture, and test-plan documents.

#### Scenario: Requirements PDF contains only requirements content
- **WHEN** the PDF playbook runs with the `pdf-requirements` profile
- **THEN** a `requirements.pdf` is produced
- **AND** the PDF contains the requirements page content
- **AND** the PDF does NOT contain architecture or test-plan pages

#### Scenario: Architecture PDF contains only architecture content
- **WHEN** the PDF playbook runs with the `pdf-architecture` profile
- **THEN** an `architecture.pdf` is produced
- **AND** the PDF contains the architecture page content
- **AND** the PDF does NOT contain requirements or test-plan pages

#### Scenario: Test-plan PDF contains only test-plan content
- **WHEN** the PDF playbook runs with the `pdf-test-plan` profile
- **THEN** a `test-plan.pdf` is produced
- **AND** the PDF contains the test-plan page content
- **AND** the PDF does NOT contain requirements or architecture pages

### Requirement: Custom nav files select single documents
Each profile SHALL reference a custom nav file that contains a single xref to the target document, so only that page is included in the assembly.

#### Scenario: Nav file for requirements
- **WHEN** the assembler builds navigation from `nav-requirements.adoc`
- **THEN** the navigation tree contains only `xref:requirements.adoc[Requirements]`
- **AND** no other pages are included

### Requirement: Single-PDF output is preserved
The existing single-PDF configuration SHALL remain available via `antora-assembler-pdf.yml` and the existing `antora-playbook-pdf.yml` SHALL continue to produce a single merged PDF.

#### Scenario: Single-PDF build still works
- **WHEN** `npx antora antora-playbook-pdf.yml` runs
- **THEN** three separate PDFs are produced (requirements, architecture, test-plan)
- **AND** the existing `antora-assembler-pdf.yml` remains usable as a standalone config for a single merged PDF
