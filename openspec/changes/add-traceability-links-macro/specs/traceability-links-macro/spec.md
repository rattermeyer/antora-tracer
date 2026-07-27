## ADDED Requirements

### Requirement: traceability:links[] macro renders outgoing links
The system SHALL provide a `traceability:links[]` macro that expands to a formatted list of all outgoing relationships for the enclosing item.

#### Scenario: Macro expands for an item with multiple relationships
- **WHEN** an item block contains `traceability:links[]` and has outgoing relations of types `addresses` and `depends_on`
- **THEN** the macro expands to AsciiDoc content showing relationships grouped by type
- **AND** each group shows a section title named after the relation type
- **AND** each target renders as a clickable xref with the target's ID and title

#### Scenario: Macro in an item with no relationships
- **WHEN** an item block contains `traceability:links[]` but the item has no outgoing relationships
- **THEN** the macro expands to nothing (empty, no error)

#### Scenario: Macro outside an item block
- **WHEN** `traceability:links[]` appears outside any `[#ID, item, ...]` block
- **THEN** the system emits a warning and leaves the macro unchanged

#### Scenario: Multiple macros in the same item
- **WHEN** an item block contains multiple `traceability:links[]` macros
- **THEN** each macro expands to the same content (all outgoing links)

---

### Requirement: Opt-in via AsciiDoc attribute
The system SHALL only expand `traceability:links[]` when the `:traceability-links:` document attribute is set to a truthy value.

#### Scenario: Attribute set to true
- **WHEN** `:traceability-links: true` is present in the document header
- **THEN** `traceability:links[]` macros are expanded

#### Scenario: Attribute not set
- **WHEN** `:traceability-links:` is not present in the document
- **THEN** `traceability:links[]` macros remain as literal text in the output

---

### Requirement: Inline macros suppressed when links macro is active
When `:traceability-links:` is enabled, the system SHALL suppress the individual rendering of inline relationship macros within item blocks that contain a `traceability:links[]` macro.

#### Scenario: Inline macros in an item with links macro
- **WHEN** `:traceability-links: true` and an item contains both `addresses:REQ-001[]` and `traceability:links[]`
- **THEN** `addresses:REQ-001[]` is removed from visible output
- **AND** the relationship is still stored in the graph

#### Scenario: Inline macros without links macro
- **WHEN** `:traceability-links: true` but an item contains `addresses:REQ-001[]` without `traceability:links[]`
- **THEN** `addresses:REQ-001[]` renders as an individual xref (existing behavior)

#### Scenario: Attribute not set
- **WHEN** `:traceability-links:` is not set
- **THEN** all inline macros render as individual xrefs (backward compatible)

---

### Requirement: Configurable display style
The system SHALL support configurable display styles via the `:traceability-style:` document attribute.

#### Scenario: List style (default)
- **WHEN** `:traceability-style: list` or the attribute is not set
- **THEN** relationships render as a bulleted list with section titles per relation type

#### Scenario: Table style
- **WHEN** `:traceability-style: table`
- **THEN** relationships render as an AsciiDoc table with columns for relation type, target ID, and title

#### Scenario: Inline style
- **WHEN** `:traceability-style: inline`
- **THEN** relationships render as comma-separated xrefs grouped by relation type

---

### Requirement: Configurable sort order
The system SHALL support configurable sort order via the `:traceability-order:` document attribute, defaulting to sort by target ID.

#### Scenario: Default order by target ID
- **WHEN** `:traceability-order:` is not set
- **THEN** relationships are sorted alphabetically by target ID within each relation type group

#### Scenario: Order by target title
- **WHEN** `:traceability-order: target-title`
- **THEN** relationships are sorted alphabetically by the target item's title

#### Scenario: Order by relation type
- **WHEN** `:traceability-order: relation-type`
- **THEN** relation type groups are sorted alphabetically, with items within each group sorted by target ID

---

### Requirement: PDF compatibility
The generated output SHALL be compatible with the asciidoctor-pdf backend.

#### Scenario: List style in PDF
- **WHEN** `:traceability-style: list` and the page is exported to PDF
- **THEN** links render as clickable PDF internal links or page references

#### Scenario: Table style in PDF
- **WHEN** `:traceability-style: table` and the page is exported to PDF
- **THEN** the table renders with xrefs as clickable PDF links

---

### Requirement: Source file not modified
The system SHALL NOT modify the `.adoc` source file on disk.

#### Scenario: Inline macros remain in source
- **WHEN** `:traceability-links: true` and `traceability:links[]` is expanded in the rendered output
- **THEN** the `.adoc` file on disk still shows `addresses:REQ-001[]` as visible text
- **AND** changes only affect the in-memory content buffer
