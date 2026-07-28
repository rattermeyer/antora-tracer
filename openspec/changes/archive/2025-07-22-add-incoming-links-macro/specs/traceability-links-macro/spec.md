## RENAMED Requirements

### Requirement: traceability:outgoing[] macro renders outgoing links
- **FROM**: `### Requirement: traceability:links[] macro renders outgoing links`
- **TO**: `### Requirement: traceability:outgoing[] macro renders outgoing links`

---

## MODIFIED Requirements

### Requirement: traceability:outgoing[] macro renders outgoing links
The system SHALL provide a `traceability:outgoing[]` macro (formerly `traceability:links[]`) that expands to a formatted list of all outgoing relationships for the enclosing item.

#### Scenario: Macro expands for an item with multiple relationships
- **WHEN** an item block contains `traceability:outgoing[]` and has outgoing relations of types `addresses` and `depends_on`
- **THEN** the macro expands to AsciiDoc content showing relationships grouped by type
- **AND** each group shows a section title named after the relation type
- **AND** each target renders as a clickable xref with the target's ID and title

#### Scenario: Macro in an item with no relationships
- **WHEN** an item block contains `traceability:outgoing[]` but the item has no outgoing relationships
- **THEN** the macro expands to nothing (empty, no error)

#### Scenario: Macro outside an item block
- **WHEN** `traceability:outgoing[]` appears outside any `[#ID, item, ...]` block
- **THEN** the system emits a warning and leaves the macro unchanged

#### Scenario: Multiple macros in the same item
- **WHEN** an item block contains multiple `traceability:outgoing[]` macros
- **THEN** each macro expands to the same content (all outgoing links)

---

### Requirement: Inline macros suppressed when links macros are active
When `:traceability-links:` is enabled, the system SHALL suppress the individual rendering of inline relationship macros within item blocks that contain a `traceability:outgoing[]` or `traceability:incoming[]` macro.

#### Scenario: Inline macros in an item with outgoing macro
- **WHEN** `:traceability-links: true` and an item contains both `addresses:REQ-001[]` and `traceability:outgoing[]`
- **THEN** `addresses:REQ-001[]` is removed from visible output
- **AND** the relationship is still stored in the graph

#### Scenario: Inline macros in an item with incoming macro
- **WHEN** `:traceability-links: true` and an item contains both `addresses:REQ-001[]` and `traceability:incoming[]`
- **THEN** `addresses:REQ-001[]` is removed from visible output
- **AND** the relationship is still stored in the graph

#### Scenario: Inline macros without any links macro
- **WHEN** `:traceability-links: true` but an item contains `addresses:REQ-001[]` without `traceability:outgoing[]` or `traceability:incoming[]`
- **THEN** `addresses:REQ-001[]` renders as an individual xref (existing behavior)

#### Scenario: Attribute not set
- **WHEN** `:traceability-links:` is not set
- **THEN** all inline macros render as individual xrefs (backward compatible)
