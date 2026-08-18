# vale-build-integration

## Purpose

Run the Vale prose linter against source AsciiDoc content from the complete Antora content catalog during the build, and gate the build according to a configurable minimum severity.

## ADDED Requirements

### Requirement: Vale lints page and partial source content during the build
The system SHALL run Vale against the source AsciiDoc content of every page and partial file in the content catalog when the extension is enabled.

#### Scenario: Page content is linted
- **WHEN** the extension is enabled and a page file contains prose that violates a configured Vale rule
- **THEN** the system reports the finding with the page's source file and line reference

#### Scenario: Partial content is linted
- **WHEN** the extension is enabled and a partial file contains prose that violates a configured Vale rule
- **THEN** the system reports the finding with the partial's source file and line reference

### Requirement: The build gates on a configurable minimum severity
The system SHALL fail the build when Vale reports a finding at or above the configured minimum severity, and SHALL log findings below that severity without failing.

#### Scenario: Finding at or above the minimum severity fails the build
- **WHEN** a finding's severity meets or exceeds the configured minimum severity
- **THEN** the build fails with the finding reported

#### Scenario: Finding below the minimum severity is logged
- **WHEN** a finding's severity is below the configured minimum severity
- **THEN** the finding is logged and the build continues

### Requirement: The extension reports the Vale configuration source
The system SHALL load Vale's configuration from the path supplied in the playbook configuration, so users control which styles and rules apply.

#### Scenario: Configured Vale config is used
- **WHEN** the playbook configuration specifies a Vale configuration path
- **THEN** Vale is invoked with that configuration

### Requirement: Missing executables fail with an actionable message
When the extension is enabled, if the `vale` or `asciidoctor` executable is unavailable, the system SHALL fail the build with a message naming the missing executable.

#### Scenario: Vale binary is missing
- **WHEN** the `vale` executable is not on the path
- **THEN** the build fails with a message stating that `vale` is required

#### Scenario: Asciidoctor binary is missing
- **WHEN** the `asciidoctor` executable is not on the path
- **THEN** the build fails with a message stating that `asciidoctor` is required

### Requirement: The extension is opt-in
The system SHALL NOT run Vale unless the extension is explicitly registered in the playbook, so existing builds are unaffected.

#### Scenario: Extension not registered
- **WHEN** the extension is not registered in the playbook
- **THEN** no Vale processing occurs and the build proceeds unchanged

### Requirement: Source layout is out of scope
The system SHALL NOT enforce source line layout such as one sentence per line; that concern belongs to the source-layout checker.

#### Scenario: A multi-sentence source line is not a Vale failure
- **WHEN** a source line contains more than one sentence
- **THEN** Vale reports no finding for line layout alone
