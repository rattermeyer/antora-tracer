# Git Describe

## Purpose

Expose the build version string (`git describe --tags --always --dirty`) as a single `git_describe` key in both the site keys and the document attributes, so HTML, PDF, and DOCX output can render the version from one source of truth.

## Requirements

### Requirement: git describe is computed once per build
The extension SHALL compute the build version string using `git describe --tags --always --dirty`, run from the playbook directory, exactly once per Antora build.

#### Scenario: git describe succeeds
- **WHEN** the build runs inside a git repository
- **THEN** the extension SHALL run `git describe --tags --always --dirty` with the playbook directory as the working directory
- **AND** SHALL use the trimmed command output as the build version string

### Requirement: git_describe is exposed as a site key
The extension SHALL set `site.keys.git_describe` to the computed version string, making it available to HTML Handlebars templates.

#### Scenario: site key set
- **WHEN** the version string is computed successfully
- **THEN** `site.keys.git_describe` SHALL equal the trimmed `git describe` output
- **AND** the value SHALL be reachable in UI templates as `{{site.keys.git_describe}}`

### Requirement: git_describe is exposed as a document attribute
The extension SHALL set `asciidoc.attributes.git_describe` to the computed version string, making it available to AsciiDoc content, the PDF theme, and the DOCX converter.

#### Scenario: document attribute set
- **WHEN** the version string is computed successfully
- **THEN** `asciidoc.attributes.git_describe` SHALL equal the trimmed `git describe` output
- **AND** the value SHALL be referenceable as `{git_describe}` in AsciiDoc content and backend themes

### Requirement: build succeeds outside a git repository
When the version string cannot be computed — the build directory is not inside a git repository, or the `git` command is unavailable or fails — the extension SHALL set neither key and SHALL NOT fail the build.

#### Scenario: not a git repository
- **WHEN** `git describe` exits non-zero (for example, the build runs outside a git repository)
- **THEN** neither `site.keys.git_describe` nor `asciidoc.attributes.git_describe` SHALL be set
- **AND** the Antora build SHALL complete without error
