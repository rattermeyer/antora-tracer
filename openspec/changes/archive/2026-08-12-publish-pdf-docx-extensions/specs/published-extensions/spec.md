## ADDED Requirements

### Requirement: PDF extension is published and referenceable by package name
The `antora-tracer` npm package SHALL include `lib/src/antora-pdf-extension.cjs` and export it under the subpath `antora-tracer/antora-pdf` so consumers can reference it in their playbooks without copying files from the repository.

#### Scenario: Consumer references PDF extension by package name
- **WHEN** a consumer adds `require: antora-tracer/antora-pdf` to their Antora playbook extensions
- **THEN** Antora resolves the extension from `node_modules/antora-tracer/lib/src/antora-pdf-extension.cjs`
- **AND** the PDF assembler pipeline is registered for the build

#### Scenario: npm pack includes the PDF extension
- **WHEN** `npm pack --dry-run` runs in the project root
- **THEN** `lib/src/antora-pdf-extension.cjs` appears in the file list

### Requirement: DOCX extension is published and referenceable by package name
The `antora-tracer` npm package SHALL include `lib/src/antora-docx-extension.cjs` and `lib/src/antora-docx-converter.cjs` and export the extension under the subpath `antora-tracer/antora-docx`.

#### Scenario: Consumer references DOCX extension by package name
- **WHEN** a consumer adds `require: antora-tracer/antora-docx` to their Antora playbook extensions
- **THEN** Antora resolves the extension from `node_modules/antora-tracer/lib/src/antora-docx-extension.cjs`
- **AND** the DOCX assembler pipeline is registered for the build

#### Scenario: npm pack includes the DOCX extension and converter
- **WHEN** `npm pack --dry-run` runs in the project root
- **THEN** `lib/src/antora-docx-extension.cjs` appears in the file list
- **AND** `lib/src/antora-docx-converter.cjs` appears in the file list

### Requirement: Assembler packages declared as optional peer dependencies
The `package.json` SHALL declare `@antora/assembler` and `@antora/pdf-extension` as `peerDependencies` with `optional: true` in `peerDependenciesMeta` so npm signals the requirement to consumers who use PDF or DOCX output without requiring them for consumers who do not. These packages SHALL also remain in `devDependencies` for local development builds.

#### Scenario: peerDependencies declared correctly
- **WHEN** reading `package.json`
- **THEN** `@antora/assembler` appears in `peerDependencies` and `devDependencies`
- **AND** `@antora/pdf-extension` appears in `peerDependencies` and `devDependencies`
- **AND** both have `optional: true` in `peerDependenciesMeta`

### Requirement: Assembler configs and adoc-to-docx script are example-site configuration
The assembler config YMLs and `adoc-to-docx` script SHALL reside in `examples/` as reference consumer configuration, not at the project root and not in the npm package. The how-to documentation SHALL explain that consumers create their own configs modelled on these examples.

#### Scenario: Root is free of assembler configs
- **WHEN** listing files in the project root
- **THEN** no `antora-assembler-*.yml` files exist at the root
- **AND** no `adoc-to-docx` script exists at the root
- **AND** no `antora-pdf-extension.cjs`, `antora-docx-extension.cjs`, or `antora-docx-converter.cjs` exist at the root

#### Scenario: Example configs exist in examples/
- **WHEN** listing files in `examples/`
- **THEN** `antora-assembler-pdf*.yml` files exist as reference configuration
- **AND** `antora-assembler-docx*.yml` files exist as reference configuration
- **AND** `adoc-to-docx` exists as a reference script
