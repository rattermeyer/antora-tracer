## MODIFIED Requirements

### Requirement: PDF extension is a peer dependency
The `@antora/pdf-extension` npm package SHALL be listed as a `peerDependency` (with `optional: true` in `peerDependenciesMeta`) so consumers who want PDF output are signalled to install it explicitly. It SHALL also remain in `devDependencies` for local development.

#### Scenario: npm install fetches the PDF extension for development
- **WHEN** `npm install` runs in the project root
- **THEN** `@antora/pdf-extension` is available in `node_modules/` (from devDependencies)
- **AND** `@antora/assembler` is also available as its dependency

#### Scenario: Consumer is signalled to install peers
- **WHEN** a consumer runs `npm install antora-tracer`
- **THEN** npm shows a peer dependency warning if `@antora/pdf-extension` or `@antora/assembler` is missing
- **AND** the warning states these are optional for PDF/DOCX output

### Requirement: PDF playbook references extension by local path in development
The `antora-playbook-pdf.yml` example playbook SHALL reference the PDF extension using a local path (`./lib/src/antora-pdf-extension.cjs`) since it is the project's own development playbook. Consumer documentation SHALL show the package subpath pattern (`antora-tracer/antora-pdf`).

#### Scenario: Playbook uses local path for self-reference
- **WHEN** reading `antora-playbook-pdf.yml`
- **THEN** the PDF extension entry reads `require: ./lib/src/antora-pdf-extension.cjs`
