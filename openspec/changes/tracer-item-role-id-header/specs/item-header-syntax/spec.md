## Purpose

Defines compatible item-header forms so traceable items can carry a dedicated AsciiDoc role class without losing their anchor, attributes, or processing behavior.

## ADDED Requirements

### Requirement: Item headers support a tracer role and ID

The system SHALL recognize `[.tracer#ID, item, ...]` as an item declaration equivalent to `[#ID, item, ...]` with respect to the item's ID, role, title, status, additional attributes, content, and relationships. Existing `[#ID, item, ...]` declarations SHALL remain supported.

#### Scenario: Parse a tracer-role item header
- **WHEN** an AsciiDoc document contains `[.tracer#REQ-001, item, role=requirement, title="Example"]` followed by a valid item block
- **THEN** the system registers one item with ID `REQ-001`, role `requirement`, and title `REQ-001 — Example`
- **AND** the item content and relationships are processed as for the equivalent existing header

#### Scenario: Preserve existing item header behavior
- **WHEN** an AsciiDoc document contains `[#REQ-001, item, role=requirement, title="Example"]` followed by a valid item block
- **THEN** the system registers and renders the item as before this change

#### Scenario: Render the tracer role and ID
- **WHEN** an item declared with `[.tracer#REQ-001, item, ...]` is rendered by Asciidoctor
- **THEN** the item block has the `REQ-001` anchor and the `tracer` CSS role class
- **AND** any semantic role class such as `requirement` remains present

### Requirement: Tracer-role headers work across item processing

The system SHALL treat the tracer-role header as an item declaration in every processing path that recognizes, transforms, renders, or locates item blocks, including Antora relationship rendering and CLI item lifecycle operations.

#### Scenario: Expand relationship macros inside a tracer-role item
- **WHEN** a tracer-role item contains a supported relationship rendering macro in its body
- **THEN** the macro is associated with that item and processed as for the equivalent existing header

#### Scenario: Apply supersession rendering to a tracer-role item
- **WHEN** a tracer-role item is superseded and superseded rendering is enabled
- **THEN** its block receives the same supersession treatment as the equivalent existing item header

#### Scenario: Locate a tracer-role item for a CLI lifecycle operation
- **WHEN** a CLI lifecycle operation locates an item declared with `[.tracer#REQ-001, item, ...]`
- **THEN** it identifies the complete block by ID and its matching closing delimiter

#### Scenario: Ignore tracer-role examples in verbatim blocks
- **WHEN** `[.tracer#REQ-001, item, ...]` appears inside an AsciiDoc verbatim block
- **THEN** it is treated as example text and is not registered or transformed as a live item
