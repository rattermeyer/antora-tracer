## ADDED Requirements

### Requirement: Configuration file defines roles

The system SHALL read roles from a configuration file (YAML format) that defines the valid roles for traceable items.

#### Scenario: Configuration with roles list
- **WHEN** configuration file contains `roles: [requirement, design, test]`
- **THEN** system recognizes `requirement`, `design`, and `test` as valid roles
- **AND** system rejects items with roles not in this list (with warning)

#### Scenario: Empty roles list
- **WHEN** configuration file contains `roles: []`
- **THEN** system generates an error
- **AND** error message indicates at least one role must be defined

### Requirement: Configuration file defines relations

The system SHALL read relation definitions from the configuration file that define which relation types are allowed between which role pairs.

#### Scenario: Configuration with relation matrix
- **WHEN** configuration defines relations as nested structure:
  ```yaml
  relations:
    requirement:
      design: [addresses, satisfies]
      test: [verified_by]
    design:
      test: [validated_by]
  ```
- **THEN** system allows these specific relations between role pairs
- **AND** system validates items against these definitions

#### Scenario: Missing relations section
- **WHEN** configuration file does not contain a `relations` section
- **THEN** system treats all relations as invalid
- **AND** system generates error for any relation between items

### Requirement: Configuration file defines matrices

The system SHALL read matrix definitions from the configuration file that define which matrices to generate.

#### Scenario: Configuration with matrix definitions
- **WHEN** configuration defines:
  ```yaml
  matrices:
    - name: requirements-traceability
      rows: requirement
      columns: [design, test]
    - name: design-verification
      rows: design
      columns: [test]
  ```
- **THEN** system generates both `requirements-traceability` and `design-verification` matrices
- **AND** each matrix uses the specified row and column roles

#### Scenario: No matrices defined
- **WHEN** configuration file does not contain a `matrices` section
- **THEN** system generates no matrices
- **AND** system logs a warning about missing matrix definitions

### Requirement: Configuration file is required

The system SHALL require a configuration file to be present and valid before processing items.

#### Scenario: Missing configuration file
- **WHEN** no configuration file is found
- **THEN** system generates an error
- **AND** error message indicates configuration file is required

#### Scenario: Invalid YAML in configuration
- **WHEN** configuration file contains invalid YAML syntax
- **THEN** system generates an error
- **AND** error message includes YAML parsing error details

### Requirement: Configuration file location

The system SHALL look for configuration in a default location and allow it to be specified via options.

#### Scenario: Default configuration location
- **WHEN** no configuration path is specified
- **THEN** system looks for `traceability.yml` in the project root
- **AND** system looks for `traceability.yaml` in the project root
- **AND** system looks for traceability config in `antora.yml`

#### Scenario: Custom configuration path
- **WHEN** user specifies `--config my-config.yml`
- **THEN** system loads configuration from the specified path
- **AND** system validates the configuration file exists

### Requirement: Configuration validation

The system SHALL validate the configuration file structure and content.

#### Scenario: Validate roles are strings
- **WHEN** configuration contains `roles: [requirement, 123, design]`
- **THEN** system generates an error
- **AND** error message indicates roles must be strings

#### Scenario: Validate relations structure
- **WHEN** configuration contains malformed relations structure
- **THEN** system generates an error
- **AND** error message indicates the expected structure

### Requirement: Configuration file can reference presets

The system SHALL support extending configuration from presets.

#### Scenario: Extend from preset
- **WHEN** configuration contains `extends: requirements-engineering`
- **THEN** system loads the specified preset
- **AND** system merges preset configuration with current configuration
- **AND** current configuration overrides preset values

#### Scenario: Invalid preset reference
- **WHEN** configuration references a non-existent preset
- **THEN** system generates an error
- **AND** error message lists available presets
