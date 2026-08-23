# traceability-links-macro

## Purpose

Renders outgoing, incoming, and combined relationships inside item blocks via `traceability:outgoing[]`, `traceability:incoming[]`, and `traceability:links[]` macros. Provides configurable display styles and sort orders gated by the `:traceability-links:` document attribute.

## Requirements

### Requirement: traceability:outgoing[] macro renders outgoing links
The system SHALL provide a `traceability:outgoing[]` macro (formerly `traceability:links[]`) that expands to a formatted list of all outgoing relationships for the enclosing item.

### Requirement: Empty-state message when item has no outgoing relationships
If the enclosing item has no outgoing relationships, then the `traceability:outgoing[]` macro SHALL render a configurable empty-state message controlled by the `:traceability-empty:` document attribute.

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

#### Scenario: Multiple macros in the same item
- **WHEN** an item block contains multiple `traceability:outgoing[]` macros
- **THEN** each macro expands to the same content (all outgoing links)

---

### Requirement: Opt-in via AsciiDoc attribute
The system SHALL only expand `traceability:outgoing[]` and `traceability:incoming[]` when the `:traceability-links:` document attribute is set to a truthy value.

#### Scenario: Attribute set to true
- **WHEN** `:traceability-links: true` is present in the document header
- **THEN** `traceability:outgoing[]` and `traceability:incoming[]` macros are expanded

#### Scenario: Attribute not set
- **WHEN** `:traceability-links:` is not present in the document
- **THEN** `traceability:outgoing[]` and `traceability:incoming[]` macros remain as literal text in the output

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

---

### Requirement: Configurable display style
The system SHALL support configurable display styles via the `:traceability-style:` document attribute for both `traceability:outgoing[]` and `traceability:incoming[]` macros.

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
The system SHALL support configurable sort order via the `:traceability-order:` document attribute for both `traceability:outgoing[]` and `traceability:incoming[]` macros, defaulting to sort by target ID for outgoing and source ID for incoming.

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
The generated output from `traceability:outgoing[]` and `traceability:incoming[]` SHALL use standard AsciiDoc constructs, ensuring compatibility with both HTML and PDF rendering backends.

#### Scenario: List style in PDF
- **WHEN** `:traceability-style: list` and the page is exported to PDF
- **THEN** links render as clickable PDF internal links or page references

#### Scenario: Table style in PDF
- **WHEN** `:traceability-style: table` and the page is exported to PDF
- **THEN** the table renders with xrefs as clickable PDF links

---

### Requirement: Source file not modified
The system SHALL NOT modify the `.adoc` source file on disk when expanding `traceability:outgoing[]` or `traceability:incoming[]`.

#### Scenario: Inline macros remain in source
- **WHEN** `:traceability-links: true` and `traceability:outgoing[]` is expanded in the rendered output
- **THEN** the `.adoc` file on disk still shows `addresses:REQ-001[]` as visible text
- **AND** changes only affect the in-memory content buffer

---

### Requirement: Collapsible list-style output via document attribute
The system SHALL support a `:traceability-collapsible:` document attribute that, when set to a truthy value, wraps each relation-type group in list-style output in a `[%collapsible]` AsciiDoc block.

#### Scenario: Collapsible enabled
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: list` (or default)
- **THEN** each relation-type group renders as a `[%collapsible]` block with the relation type as the title and the links as the block body

#### Scenario: Collapsible disabled (default)
- **WHEN** `:traceability-collapsible:` is absent or set to a non-truthy value
- **THEN** list-style output renders as flat blocks (existing behavior, no collapsible wrapping)

#### Scenario: Collapsible with table style has no effect
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: table`
- **THEN** the table renders without collapsible wrapping (table style is unaffected)

#### Scenario: Collapsible with inline style has no effect
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: inline`
- **THEN** the inline output renders without collapsible wrapping (inline style is unaffected)

---

### Requirement: Graph isolation per component version
Relationship macro expansion SHALL produce xrefs only to items in the same component version as the enclosing page.

#### Scenario: Cross-version xref is not generated
- **WHEN** a site is built with two component versions (`v0.10.x` and `v0.11.x`)
- **AND** `v0.10.x` contains a page with `leads_to:UC-001[]`
- **AND** `UC-001` is defined in `v0.11.x`'s `use-cases.adoc` but not in `v0.10.x`
- **THEN** no `xref:use-cases.adoc#UC-001` SHALL be generated in `v0.10.x` output

#### Scenario: Same-version xrefs work normally
- **WHEN** a single component version is built
- **THEN** xrefs SHALL resolve to pages within that version as before

---

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
- **AND** when `:traceability-empty: none` (default), no empty incoming section is present
- **AND** when `:traceability-empty:` is `italic` or `admonition`, an empty-state message for the incoming direction is rendered

#### Scenario: Macro in an item with only incoming relationships
- **WHEN** an item block contains `traceability:links[]` but the item has only incoming relationships
- **THEN** only the incoming groups render with reverse-type labels
- **AND** when `:traceability-empty: none` (default), no empty outgoing section is present
- **AND** when `:traceability-empty:` is `italic` or `admonition`, an empty-state message for the outgoing direction is rendered

#### Scenario: Macro in an item with no relationships
- **WHEN** an item block contains `traceability:links[]` but the item has no relationships of any kind
- **AND** `:traceability-empty:` is not set or is set to `none`
- **THEN** the macro expands to nothing (empty, backward compatible)

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

---

### Requirement: Cross-module and cross-component xref resolution
When an item in one module has relationships to items in other modules or components, the `traceability:outgoing[]` and `traceability:incoming[]` macros SHALL generate xrefs with the correct Antora prefix (`component:module:` or `module:`) so Antora can resolve them correctly.

#### Scenario: Outgoing xref to an item in a different module
- **WHEN** `:traceability-links: true`
- **AND** an item in the `requirements` module has an outgoing relation to an item in the `ROOT` module (e.g., `REQ-001` addresses `ARC-001` defined in `modules/ROOT/pages/architecture.adoc`)
- **AND** `traceability:outgoing[]` is expanded
- **THEN** the xref for `ARC-001` SHALL be `xref:ROOT:architecture#ARC-001[...]`

#### Scenario: Outgoing xref to an item in a different component
- **WHEN** `:traceability-links: true`
- **AND** an item in component `tracer`, module `ROOT` has an outgoing relation to an item in component `other-comp`, module `ROOT`
- **AND** `traceability:outgoing[]` is expanded
- **THEN** the xref for the target SHALL be `xref:other-comp:ROOT:page#ID[...]`

#### Scenario: Incoming xref from an item in a different module
- **WHEN** `:traceability-links: true`
- **AND** an item in the `requirements` module has an incoming relation from an item in the `ROOT` module (e.g., `ARC-001` addresses `REQ-001`)
- **AND** `traceability:incoming[]` is expanded
- **THEN** the xref for `ARC-001` SHALL be `xref:ROOT:architecture#ARC-001[...]`

#### Scenario: Outgoing xref to an item in the same module
- **WHEN** both the current item and the target item are in the same component and module (`ROOT`)
- **AND** `traceability:outgoing[]` is expanded
- **THEN** the xref SHALL NOT include a module prefix (e.g., `xref:test-plan#TEST-001[...]`)

#### Scenario: Multiple related items across different modules
- **WHEN** an item has outgoing relations to items in two different modules (`ROOT` and `quality`)
- **AND** `traceability:outgoing[]` is expanded
- **THEN** each xref SHALL use the correct module prefix for its target
- **AND** the grouped output SHALL work correctly (list, table, or inline style)

#### Scenario: Item with no component/module info (CLI context)
- **WHEN** the target item has no `component` or `module` fields (e.g., items parsed via CLI)
- **THEN** the xref SHALL have no prefix (backward-compatible)
