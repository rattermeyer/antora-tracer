## MODIFIED Requirements

### Requirement: traceability:outgoing[] macro renders outgoing links
The system SHALL provide a `traceability:outgoing[]` macro that expands to a formatted list of all outgoing relationships for the enclosing item. When the item has no outgoing relationships, the macro SHALL render a configurable empty-state message controlled by the `:traceability-empty:` document attribute.

#### Scenario: Macro expands for an item with multiple relationships
- **WHEN** an item block contains `traceability:outgoing[]` and has outgoing relations of types `addresses` and `depends_on`
- **THEN** the macro expands to AsciiDoc content showing relationships grouped by type
- **AND** each group shows a section title named after the relation type
- **AND** each target renders as a clickable xref with the target's ID and title

#### Scenario: Macro in an item with no relationships — default (none)
- **WHEN** an item block contains `traceability:outgoing[]` but the item has no outgoing relationships
- **AND** `:traceability-empty:` is not set or is set to `none`
- **THEN** the macro expands to nothing (empty, backward compatible)

#### Scenario: Macro in an item with no relationships — italic style
- **WHEN** an item block contains `traceability:outgoing[]` but the item has no outgoing relationships
- **AND** `:traceability-empty: italic` is set
- **THEN** the macro expands to `_No outgoing relationships._`

#### Scenario: Macro in an item with no relationships — admonition style
- **WHEN** an item block contains `traceability:outgoing[]` but the item has no outgoing relationships
- **AND** `:traceability-empty: admonition` is set
- **THEN** the macro expands to a `[NOTE]` block containing "No outgoing relationships."

#### Scenario: Macro outside an item block
- **WHEN** `traceability:outgoing[]` appears outside any `[#ID, item, ...]` block
- **THEN** the macro is silently ignored (no warning, no expansion)

---

### Requirement: traceability:links[] macro renders combined outgoing and incoming links
The system SHALL provide a `traceability:links[]` macro that expands to a combined list of all outgoing and incoming relationships for the enclosing item, with outgoing groups rendered first followed by incoming groups. When either direction has no relationships, the macro SHALL render a configurable empty-state message for that direction.

#### Scenario: Macro in an item with no relationships — italic style
- **WHEN** an item block contains `traceability:links[]` but the item has no relationships of any kind
- **AND** `:traceability-empty: italic` is set
- **THEN** the macro expands to `_No outgoing relationships._\n_No incoming relationships._`

#### Scenario: Macro with outgoing but no incoming — italic style
- **WHEN** an item block contains `traceability:links[]` with outgoing relationships but no incoming relationships
- **AND** `:traceability-empty: italic` is set
- **THEN** the outgoing groups render normally
- **AND** `_No incoming relationships._` appears after the outgoing groups

#### Scenario: Macro with incoming but no outgoing — italic style
- **WHEN** an item block contains `traceability:links[]` with incoming relationships but no outgoing relationships
- **AND** `:traceability-empty: italic` is set
- **THEN** `_No outgoing relationships._` appears before the incoming groups
- **AND** the incoming groups render normally
