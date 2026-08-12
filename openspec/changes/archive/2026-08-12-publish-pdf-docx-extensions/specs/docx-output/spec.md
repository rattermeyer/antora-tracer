## MODIFIED Requirements

### Requirement: DOCX playbook references extension by local path in development
The `antora-playbook-pdf.yml` example playbook SHALL reference the DOCX extension using a local path (`./lib/src/antora-docx-extension.cjs`). Consumer documentation SHALL show the package subpath pattern (`antora-tracer/antora-docx`).

#### Scenario: Playbook uses local path for self-reference
- **WHEN** reading `antora-playbook-pdf.yml`
- **THEN** the DOCX extension entry reads `require: ./lib/src/antora-docx-extension.cjs`

### Requirement: DOCX assembler configs reside in examples/ as reference configuration
The `antora-assembler-docx*.yml` files and `adoc-to-docx` script SHALL reside in `examples/` as reference consumer configuration. The assembler config `command:` paths SHALL reference the script relative to the project root.

#### Scenario: DOCX assembler configs are in examples/
- **WHEN** listing files in `examples/`
- **THEN** `antora-assembler-docx.yml` and profile variants exist there
- **AND** `adoc-to-docx` exists there

#### Scenario: command path resolves correctly
- **WHEN** the assembler runs from the project root
- **THEN** the `command: ./examples/adoc-to-docx` path resolves to the script
- **AND** DOCX files are produced correctly
