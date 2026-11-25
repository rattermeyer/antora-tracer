## MODIFIED Requirements

### Requirement: Reference pages for macro syntax, configuration, CLI, presets, and API
The example site SHALL include Reference pages exhaustively documenting:
- Item macro syntax and attributes
- Traceability display macros (outgoing, incoming, links, graph, graph-coverage)
- Configuration options (all playbook options, traceability.yml schema — including `workflow` states/transitions and `validation` rules)
- Built-in presets (complete definition of each)
- CLI commands and flags
- Public API surface (methods, signatures, data model interfaces)

#### Scenario: Item macro reference is exhaustive
- **WHEN** a reader views the item macro reference
- **THEN** every attribute, option, and syntax variant is documented
- **AND** edge cases and validation rules are described

#### Scenario: Configuration reference documents the workflow and validation keys
- **WHEN** a reader views the configuration reference
- **THEN** the `workflow` key is documented with its `states` and `transitions`
- **AND** the `validation` key is documented with its `requiresRoles` obligation and the error an unmet rule produces

#### Scenario: Preset reference lists all built-in presets with complete definitions
- **WHEN** a reader views the preset reference
- **THEN** all four built-in presets are listed with their roles, relations, and matrices
- **AND** version and compatibility information is included

#### Scenario: API reference documents public surface
- **WHEN** a developer views the API reference
- **THEN** all public methods of RequirementsTraceabilityExtension, TraceabilityGraph, and related classes are documented
- **AND** data model interfaces (Item, ItemRelationship, etc.) are included
