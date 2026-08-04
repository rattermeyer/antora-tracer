# traceability-links-macro (delta)

## ADDED Requirements

### Requirement: traceability:links[] macro renders combined outgoing and incoming links
The system SHALL provide a `traceability:links[]` macro that expands to a combined list of all outgoing and incoming relationships for the enclosing item, with outgoing groups rendered first followed by incoming groups.

#### Scenario: Macro expands for an item with both outgoing and incoming relationships
- **WHEN** `:traceability-links: true`
- **AND** an item block contains `traceability:links[]`
- **AND** the item has outgoing relations of type `addresses` and incoming relations of type `addressed-by`
- **THEN** the macro expands to outgoing groups first (`addresses`) then incoming groups (`addressed-by`)
- **AND** each group shows its relation-type label and sorted xrefs
- **AND** no wrapper section headers (e.g., "Outgoing Relations") are present

#### Scenario: Macro in an item with only outgoing relationships
- **WHEN** an item block contains `traceability:links[]` but the item has only outgoing relationships
- **THEN** only the outgoing groups render
- **AND** no empty incoming section is present

#### Scenario: Macro in an item with only incoming relationships
- **WHEN** an item block contains `traceability:links[]` but the item has only incoming relationships
- **THEN** only the incoming groups render with inverse labels
- **AND** no empty outgoing section is present

#### Scenario: Macro in an item with no relationships
- **WHEN** an item block contains `traceability:links[]` but the item has no relationships of any kind
- **THEN** the macro expands to nothing (empty, no error)

#### Scenario: Macro respects document attributes
- **WHEN** `:traceability-links: true` and `:traceability-style: table`
- **AND** an item block contains `traceability:links[]`
- **THEN** both outgoing and incoming groups render in table style

#### Scenario: Macro not expanded when links disabled
- **WHEN** `:traceability-links:` is not set or is falsy
- **AND** an item block contains `traceability:links[]`
- **THEN** the macro remains as literal text (not expanded)

#### Scenario: Coexists with individual macros
- **WHEN** an item block contains both `traceability:links[]` and `traceability:outgoing[]`
- **THEN** both macros expand independently without interference
- **AND** `traceability:outgoing[]` renders as before (only outgoing)

#### Scenario: Multiple links macros in the same item
- **WHEN** an item block contains multiple `traceability:links[]` macros
- **THEN** each macro expands to the same combined content
