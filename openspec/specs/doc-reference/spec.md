## Purpose

The example site documentation follows the Diátaxis framework. The Reference section provides exhaustive, information-oriented documentation of every option, attribute, and command.

## Requirements

### Requirement: Reference pages for macro syntax, configuration, CLI, presets, and API
The example site SHALL include Reference pages exhaustively documenting:
- Item macro syntax and attributes
- Traceability display macros (outgoing, incoming, links, graph, graph-coverage)
- Configuration options (all playbook options, traceability.yml schema — including `workflow` states/transitions and `validation` rules)
- Built-in presets (complete definition of each)
- CLI commands and flags, including the stdout/stderr contract
- Public API surface (methods, signatures, data model interfaces)

#### Scenario: Item macro reference is exhaustive
- **WHEN** a reader views the item macro reference
- **THEN** every attribute, option, and syntax variant is documented
- **AND** edge cases and validation rules are described

#### Scenario: Configuration reference documents the workflow and validation keys
- **WHEN** a reader views the configuration reference
- **THEN** the `workflow` key is documented with its `states` and `transitions`
- **AND** the `validation` key is documented with its `requiresRoles` obligation and the error an unmet rule produces

#### Scenario: CLI reference states the stdout contract
- **WHEN** a reader views the CLI reference
- **THEN** it SHALL state that stdout carries only the command's primary output
- **AND** it SHALL state that progress and status lines go to stderr

#### Scenario: Preset reference lists all built-in presets with complete definitions
- **WHEN** a reader views the preset reference
- **THEN** all four built-in presets are listed with their roles, relations, and matrices
- **AND** version and compatibility information is included

#### Scenario: API reference documents public surface
- **WHEN** a developer views the API reference
- **THEN** all public methods of RequirementsTraceabilityExtension, TraceabilityGraph, and related classes are documented
- **AND** data model interfaces (Item, ItemRelationship, etc.) are included

### Requirement: Reference pages cross-link to other modes
Reference pages SHALL include links to relevant How-to guides, Explanation pages, and other Reference pages.

#### Scenario: Configuration reference links to related how-to
- **WHEN** a reader views the configuration reference
- **THEN** it SHALL link to "How to define a custom domain model" for practical guidance

### Requirement: Reference section in navigation
The example site navigation SHALL include a "Reference" section containing all reference pages, ordered from most-used to least-used.

#### Scenario: Navigation shows Reference section
- **WHEN** the example site is built with Antora
- **THEN** the navigation SHALL display "Reference" as a top-level section
