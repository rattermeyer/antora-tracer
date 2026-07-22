## ADDED Requirements

### Requirement: Built-in preset configurations

The system SHALL ship with built-in preset configurations for common traceability domains.

#### Scenario: List available presets
- **WHEN** user requests list of presets via CLI
- **THEN** system returns list of built-in presets
- **AND** list includes preset name, description, and version

#### Scenario: Load built-in preset
- **WHEN** user references a built-in preset name
- **THEN** system loads the preset configuration
- **AND** system validates the preset exists

### Requirement: Preset contains complete configuration

Each preset SHALL contain a complete, valid configuration that can be used as-is.

#### Scenario: Preset with roles, relations, matrices
- **WHEN** a preset is loaded
- **THEN** preset contains `roles` list
- **AND** preset contains `relations` definition
- **AND** preset contains `matrices` definition

#### Scenario: Preset is valid configuration
- **WHEN** a preset is loaded
- **THEN** system validates the preset configuration
- **AND** system rejects presets with invalid configuration

### Requirement: Preset includes documentation

Each preset SHALL include documentation explaining its purpose and usage.

#### Scenario: Preset with description
- **WHEN** a preset is defined
- **THEN** preset includes a human-readable description
- **AND** description explains the domain and use case

#### Scenario: Preset with examples
- **WHEN** a preset is defined
- **THEN** preset includes example AsciiDoc snippets
- **AND** examples demonstrate typical usage

### Requirement: Preset includes example queries

Each preset SHALL include example Neo4j Cypher queries relevant to the domain.

#### Scenario: Preset with Cypher queries
- **WHEN** a preset is defined
- **THEN** preset includes a `neo4j.queries` section
- **AND** each query has a name and description
- **AND** each query has valid Cypher syntax

#### Scenario: List preset queries via CLI
- **WHEN** user requests queries for a preset
- **THEN** system returns list of queries from the preset
- **AND** user can select a query to view or execute

### Requirement: Preset versioning

Presets SHALL have version numbers that are independent of the extension version.

#### Scenario: Preset with version
- **WHEN** a preset is defined
- **THEN** preset includes a version number
- **AND** version follows semantic versioning (MAJOR.MINOR.PATCH)

#### Scenario: Preset compatibility
- **WHEN** loading a preset
- **THEN** system checks preset compatibility with current extension version
- **AND** system warns if preset requires a newer extension version

### Requirement: Custom preset support

The system SHALL allow users to define their own presets.

#### Scenario: Load custom preset
- **WHEN** user specifies a custom preset path
- **THEN** system loads the preset from the specified path
- **AND** system validates the preset configuration

#### Scenario: Invalid custom preset
- **WHEN** a custom preset has invalid configuration
- **THEN** system generates an error
- **AND** error message indicates the validation failure
