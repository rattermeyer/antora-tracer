## ADDED Requirements

### Requirement: Custom template directory support

The system SHALL allow users to specify a custom directory containing template files to override the default templates.

#### Scenario: Custom template directory via options
- **WHEN** MatrixGenerator is instantiated with `templateDir` option
- **THEN** system loads templates from specified directory
- **AND** system falls back to default templates for any missing files

#### Scenario: Custom template directory does not exist
- **WHEN** MatrixGenerator is instantiated with non-existent `templateDir`
- **THEN** system throws clear error indicating directory does not exist

#### Scenario: Partial template override
- **WHEN** custom directory contains only some template files
- **THEN** system uses custom templates for available files
- **AND** system falls back to default templates for missing files

### Requirement: Template file naming convention

The system SHALL use a consistent naming convention for template files to enable predictable overrides.

#### Scenario: Template file names are consistent
- **WHEN** user creates custom templates
- **THEN** system expects files with `.mustache` extension
- **AND** system expects specific file names: `matrix.html.mustache`, `design-matrix.html.mustache`, etc.

#### Scenario: Partials follow naming convention
- **WHEN** user creates custom partials
- **THEN** system expects partials in `partials/` subdirectory
- **AND** system expects specific partial names: `header.mustache`, `footer.mustache`, etc.

### Requirement: Template validation

The system SHALL validate that loaded templates are valid Mustache templates.

#### Scenario: Invalid template syntax
- **WHEN** a template file contains invalid Mustache syntax
- **THEN** system throws clear error during template loading
- **AND** error message indicates which template has syntax error

#### Scenario: Template with missing required partials
- **WHEN** a template references a partial that does not exist
- **THEN** system throws clear error during template loading
- **AND** error message indicates which partial is missing

### Requirement: Graceful fallback to defaults

The system SHALL gracefully fall back to default templates when custom templates are not available.

#### Scenario: Missing custom template file
- **WHEN** custom directory is specified but a template file is missing
- **THEN** system loads default template for that file
- **AND** system logs warning about missing custom template

#### Scenario: Empty custom directory
- **WHEN** custom directory is specified but contains no template files
- **THEN** system uses all default templates
- **AND** system logs warning about empty custom directory

### Requirement: Template customization API

The system SHALL provide a clear API for users to customize templates.

#### Scenario: Options interface for template customization
- **WHEN** user wants to customize templates
- **THEN** user can pass `MatrixGeneratorOptions` to constructor
- **AND** options include `templateDir` property

#### Scenario: TypeScript types for options
- **WHEN** user imports MatrixGenerator
- **THEN** TypeScript types are available for options
- **AND** templateDir is typed as optional string

### Requirement: Documentation for template customization

The system SHALL include documentation explaining how to customize templates.

#### Scenario: README includes template customization guide
- **WHEN** user reads project documentation
- **THEN** documentation explains template customization feature
- **AND** documentation includes example of custom template directory structure

#### Scenario: Example custom templates provided
- **WHEN** user wants to see template customization examples
- **THEN** project includes example custom templates in documentation or examples directory
