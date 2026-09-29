## MODIFIED Requirements

### Requirement: Collapsible list-style output via document attribute
The system SHALL support a `:traceability-collapsible:` document attribute that, when truthy with list style, wraps all relationship-type groups rendered for an item in a single `[%collapsible]` AsciiDoc block titled `Links`. Inside the block, each relation type SHALL remain a heading with its related links beneath it.

#### Scenario: Collapsible enabled
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: list` (or default)
- **THEN** all outgoing and incoming relation-type groups for the item render inside one `[%collapsible]` block titled `Links`
- **AND** each relation type remains a heading above its related links

#### Scenario: Collapsible disabled (default)
- **WHEN** `:traceability-collapsible:` is absent or set to a non-truthy value
- **THEN** list-style output renders as flat blocks without a collapsible wrapper

#### Scenario: Collapsible with table style has no effect
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: table`
- **THEN** the table renders without collapsible wrapping

#### Scenario: Collapsible with inline style has no effect
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: inline`
- **THEN** the inline output renders without collapsible wrapping
