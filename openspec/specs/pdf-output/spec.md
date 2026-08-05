## ADDED Requirements

### Requirement: Devbox provides Ruby and Node.js for PDF builds
The devbox.json configuration SHALL include `ruby`, `bundler`, and `nodejs` packages so that `devbox shell` provides a complete PDF build environment. The init hook SHALL run `npm install` and `bundle install` automatically.

#### Scenario: Devbox shell sets up the environment
- **WHEN** a contributor runs `devbox shell`
- **THEN** `ruby --version` reports Ruby 3.x
- **AND** `bundle --version` reports Bundler is available
- **AND** `node --version` reports Node.js 20+
- **AND** `npm install` and `bundle install` have been executed

### Requirement: Gemfile locks asciidoctor-pdf version
The project SHALL include a `Gemfile` that specifies `asciidoctor-pdf` and `asciidoctor-kroki` gems so the PDF converter and diagram renderer are installed consistently across environments.

#### Scenario: Bundle install fetches required gems
- **WHEN** `bundle install` runs in the project root
- **THEN** `asciidoctor-pdf` gem is installed
- **AND** `asciidoctor-kroki` gem is installed
- **AND** `Gemfile.lock` records the exact versions

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

### Requirement: PDF extension is a dev dependency
The `@antora/pdf-extension` npm package SHALL be listed as a dev dependency in `package.json` so it is installed alongside other project dependencies.

#### Scenario: npm install fetches the PDF extension
- **WHEN** `npm install` runs
- **THEN** `@antora/pdf-extension` is available in `node_modules/`
- **AND** its dependency `@antora/assembler` is also available
