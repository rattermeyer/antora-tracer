# CLI Validate

## Purpose

Provide a `validate` command on the CLI that checks the traceability graph for errors — invalid relation types, orphaned relationships, duplicate item IDs, and circular references — and reports them with actionable diagnostics, without requiring an Antora build.

## Requirements

### Requirement: CLI exposes a validate command
The CLI SHALL provide a `validate` command that reads AsciiDoc source files (via `-i/--input`) and the traceability configuration (via `--config`) and reports validation errors.
No Antora build SHALL be required.

#### Scenario: Valid input reports no errors
- **WHEN** user runs `antora-tracer validate -i docs/ --config traceability.yml` on a site with no invalid relationships
- **THEN** the command reports no validation errors
- **AND** exits with code 0

#### Scenario: Invalid relation type is reported
- **WHEN** a relationship uses a relation type that is not configured for the source-target role pair
- **THEN** the command reports it as an error naming the source and target item IDs with roles, the invalid relation type, and the list of allowed alternatives
- **AND** exits with a non-zero code

#### Scenario: Orphaned relationship is reported
- **WHEN** a relationship references a target item that does not exist
- **THEN** the command reports it as an error naming the file, line, and the missing target
- **AND** exits with a non-zero code

#### Scenario: Circular reference is reported
- **WHEN** the graph contains a cycle, including a self-referencing relationship
- **THEN** the command reports the circular reference
- **AND** exits with a non-zero code

#### Scenario: Duplicate item ID is reported
- **WHEN** the same item ID is defined more than once across the input files
- **THEN** the command reports it as an error naming the duplicate ID and the file and line of both definitions
- **AND** exits with a non-zero code
