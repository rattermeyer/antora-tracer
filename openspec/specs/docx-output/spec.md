## ADDED Requirements

### Requirement: DOCX wrapper script converts assembled AsciiDoc to DOCX
The project SHALL include an `adoc-to-docx` shell script (in `examples/`) that reads assembled AsciiDoc from stdin, converts it to DocBook using `asciidoctor -b docbook` with Kroki support, then pipes the result through `pandoc -f docbook -t docx` to produce a DOCX file at the path specified by the `-o` argument.

#### Scenario: Wrapper converts adoc to docx
- **WHEN** `adoc-to-docx -o output.docx -` is invoked with assembled AsciiDoc on stdin
- **THEN** the script runs `bundle exec asciidoctor -b docbook -r asciidoctor-kroki -a allow-uri-read -a kroki-default-format=png -o - -` to produce DocBook on stdout
- **AND** pipes the DocBook into `pandoc -f docbook -t docx -o output.docx -`
- **AND** the output file `output.docx` exists and is a valid DOCX file

#### Scenario: Wrapper handles additional asciidoctor arguments
- **WHEN** Assembler invokes the wrapper with extra asciidoctor arguments (e.g., `adoc-to-docx -a sourcemap -o output.docx -`)
- **THEN** the extra arguments are ignored (the wrapper uses its own fixed asciidoctor invocation)
- **AND** only the `-o <path>` argument is consumed

### Requirement: DOCX assembler configs mirror PDF assembler configs
For each existing PDF assembler configuration (`examples/antora-assembler-pdf*.yml`), a corresponding DOCX assembler configuration SHALL exist (`examples/antora-assembler-docx*.yml`) that differs only in the `build.command` value, using `./examples/adoc-to-docx` instead of `bundle exec asciidoctor-pdf`.

#### Scenario: DOCX configs exist for all document profiles
- **WHEN** checking for DOCX assembler configs
- **THEN** `examples/antora-assembler-docx.yml` exists (full document)
- **AND** `examples/antora-assembler-docx-architecture.yml` exists
- **AND** `examples/antora-assembler-docx-requirements.yml` exists
- **AND** `examples/antora-assembler-docx-use-cases.yml` exists
- **AND** `examples/antora-assembler-docx-test-plan.yml` exists

#### Scenario: DOCX config produces docx not pdf
- **WHEN** the assembler processes a DOCX config
- **THEN** the output file has `.docx` extension
- **AND** the `build.command` invokes `./examples/adoc-to-docx` not `asciidoctor-pdf`

### Requirement: PDF playbook includes DOCX assembler configurations
The `antora-playbook-pdf.yml` SHALL register DOCX assembler configs alongside PDF assembler configs so a single build produces both PDF and DOCX outputs.

#### Scenario: Single build produces both formats
- **WHEN** `npx antora antora-playbook-pdf.yml` runs
- **THEN** PDF files are produced as before
- **AND** DOCX files are produced alongside them in the build directory
- **AND** both formats are published to the site output

### Requirement: pandoc is available in the build environment
The project SHALL declare `pandoc` as a dependency in `devbox.json` so that `devbox shell` provides the pandoc binary.

#### Scenario: Devbox provides pandoc
- **WHEN** a contributor runs `devbox shell`
- **THEN** `pandoc --version` reports pandoc 3.x
- **AND** the `pandoc` binary is on the PATH

#### Scenario: Pandoc is documented as a build prerequisite
- **WHEN** reading the project documentation
- **THEN** the build prerequisites list mentions pandoc alongside Ruby and Node.js
- **AND** instructions are provided for installing pandoc without devbox (`apt install pandoc`, `brew install pandoc`, `choco install pandoc`)

### Requirement: DOCX output format is documented

### Requirement: DOCX playbook references extension by local path in development
The `antora-playbook-pdf.yml` example playbook SHALL reference the DOCX extension using a local path (`./lib/src/antora-docx-extension.cjs`). Consumer documentation SHALL show the package subpath pattern (`@antora-tracer/core/antora-docx`).

#### Scenario: Playbook uses local path for self-reference
- **WHEN** reading `antora-playbook-pdf.yml`
- **THEN** the DOCX extension entry reads `require: ./lib/src/antora-docx-extension.cjs`

### Requirement: DOCX output format is documented
The project documentation SHALL include a how-to guide for generating DOCX output and reference documentation for the DOCX assembler configuration.

#### Scenario: How-to guide exists
- **WHEN** reading `examples/modules/ROOT/pages/how-to/`
- **THEN** a `generate-docx.adoc` page exists describing how to build DOCX from the example site
- **AND** the guide mentions pandoc as a prerequisite

#### Scenario: Reference docs cover DOCX assembler config
- **WHEN** reading the developer guide or reference documentation
- **THEN** the DOCX assembler configs are listed alongside PDF assembler configs
- **AND** the `adoc-to-docx` wrapper script is documented
