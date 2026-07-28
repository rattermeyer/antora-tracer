# incoming-links-macro

## Purpose

Renders reverse relationships (incoming links) inside item blocks via the `traceability:incoming[]` macro. Complements `traceability:outgoing[]` to provide bidirectional link visibility on AsciiDoc pages.

## Requirements

### Requirement: traceability:incoming[] macro renders incoming links
The system SHALL provide a `traceability:incoming[]` macro that expands to a formatted list of all relationships pointing to the enclosing item (reverse relationships).

#### Scenario: Macro expands for an item with incoming relationships
- **WHEN** an item block contains `traceability:incoming[]` and other items have declared relationships targeting this item
- **THEN** the macro expands to AsciiDoc content showing incoming relationships grouped by type
- **AND** each group shows a section title using the inverse relation type label (e.g., `addresses` displays as `Addressed by`)
- **AND** each source item renders as a clickable xref with its ID and title

#### Scenario: Macro in an item with no incoming relationships
- **WHEN** an item block contains `traceability:incoming[]` but no other items target this item
- **THEN** the macro expands to nothing (empty, no error)

#### Scenario: Macro outside an item block
- **WHEN** `traceability:incoming[]` appears outside any `[#ID, item, ...]` block
- **THEN** the macro is silently ignored (no warning, no expansion)

#### Scenario: Multiple incoming macros in the same item
- **WHEN** an item block contains multiple `traceability:incoming[]` macros
- **THEN** each macro expands to the same content (all incoming links)

#### Scenario: Coexisting with outgoing macro
- **WHEN** an item block contains both `traceability:outgoing[]` and `traceability:incoming[]`
- **THEN** each macro expands independently to its respective content

### Requirement: Incoming macro respects document attributes
The system SHALL gate `traceability:incoming[]` expansion on the same `:traceability-links:` document attribute as the outgoing macro.

#### Scenario: Attribute set to true
- **WHEN** `:traceability-links: true` is present in the document header
- **THEN** `traceability:incoming[]` macros are expanded

#### Scenario: Attribute not set
- **WHEN** `:traceability-links:` is not present in the document
- **THEN** `traceability:incoming[]` macros remain as literal text in the output

### Requirement: Incoming macro display styles
The system SHALL support the same display styles for `traceability:incoming[]` as for the outgoing macro, via the `:traceability-style:` document attribute.

#### Scenario: List style (default)
- **WHEN** `:traceability-style: list` or the attribute is not set
- **THEN** incoming relationships render as a bulleted list with section titles per inverse relation type

#### Scenario: Table style
- **WHEN** `:traceability-style: table`
- **THEN** incoming relationships render as an AsciiDoc table with columns for relation type, source ID, and title

#### Scenario: Inline style
- **WHEN** `:traceability-style: inline`
- **THEN** incoming relationships render as comma-separated xrefs grouped by inverse relation type

### Requirement: Incoming macro sort order
The system SHALL support the same sort orders for `traceability:incoming[]` as for the outgoing macro, via the `:traceability-order:` document attribute, defaulting to sort by source ID.

#### Scenario: Default order by source ID
- **WHEN** `:traceability-order:` is not set
- **THEN** incoming relationships are sorted alphabetically by source item ID within each relation type group

#### Scenario: Order by source title
- **WHEN** `:traceability-order: target-title`
- **THEN** incoming relationships are sorted alphabetically by the source item's title

#### Scenario: Order by relation type
- **WHEN** `:traceability-order: relation-type`
- **THEN** inverse relation type groups are sorted alphabetically, with items within each group sorted by source ID

### Requirement: Inverse relation type labels
The system SHALL transform relation type names to their inverse form for display in `traceability:incoming[]` using the existing `INVERSE_MAP`. When a relation type has no inverse mapping, the raw type name SHALL be displayed.

#### Scenario: Known relation type has inverse
- **WHEN** a relationship of type `addresses` points to the enclosing item
- **THEN** the section title displays as `Addressed by`

#### Scenario: User-defined relation type without inverse
- **WHEN** a relationship of a user-defined type (not in `INVERSE_MAP`) points to the enclosing item
- **THEN** the raw relation type name is displayed, capitalized

### Requirement: Incoming macro PDF compatibility
The generated output from `traceability:incoming[]` SHALL be standard AsciiDoc constructs — not raw HTML — ensuring compatibility with both HTML and PDF backends.

#### Scenario: List style in PDF
- **WHEN** `:traceability-style: list` and the page is exported to PDF
- **THEN** incoming links render as clickable PDF internal links or page references

#### Scenario: Table style in PDF
- **WHEN** `:traceability-style: table` and the page is exported to PDF
- **THEN** the table renders with xrefs as clickable PDF links

### Requirement: Source file not modified by incoming macro
The system SHALL NOT modify the `.adoc` source file on disk when expanding `traceability:incoming[]`.

#### Scenario: Macro expansion is in-memory only
- **WHEN** `:traceability-links: true` and `traceability:incoming[]` is expanded in the rendered output
- **THEN** the `.adoc` file on disk still shows `traceability:incoming[]` as literal text
- **AND** changes only affect the in-memory content buffer

---

### Requirement: Incoming macro supports collapsible output
The system SHALL apply the same `:traceability-collapsible:` document attribute to `traceability:incoming[]` output as it does for `traceability:outgoing[]`. When enabled, each inverse relation-type group in list-style incoming output SHALL be wrapped in a `[%collapsible]` block.

#### Scenario: Collapsible enabled for incoming macro
- **WHEN** `:traceability-collapsible: true` and an item block contains `traceability:incoming[]`
- **THEN** each incoming relation-type group renders as a `[%collapsible]` block with the inverse type label as the title

#### Scenario: Collapsible disabled for incoming macro
- **WHEN** `:traceability-collapsible:` is absent and an item block contains `traceability:incoming[]`
- **THEN** incoming output renders as flat blocks (existing behavior)
