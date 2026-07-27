# matrix-item-linking

## Purpose

Add deep-link navigation from traceability matrix cells to item definitions in rendered HTML.

## Requirements

### Requirement: Matrix displays row items as clickable links
The matrix SHALL render row item IDs as hyperlinks that navigate to the item's definition in the rendered HTML documentation.

#### Scenario: User clicks a row item ID in HTML matrix
- **WHEN** user clicks on a row item ID (e.g., REQ-001) in an HTML matrix
- **THEN** browser navigates to the item's HTML page with fragment identifier (e.g., `../../requirements.html#REQ-001`)
- **AND** navigation opens in the same browser tab

#### Scenario: Row item without source file
- **WHEN** a row item has no `sourceFile` defined
- **THEN** the item ID renders as plain text (no link)

#### Scenario: Row item with subdirectory source
- **WHEN** a row item's source file is in a subdirectory (e.g., `traceability/index.adoc`)
- **THEN** the link navigates to the correct subdirectory path (e.g., `../../traceability/index.html#REQ-035`)

---

### Requirement: Matrix displays cell items as clickable links
The matrix SHALL render cell item IDs as hyperlinks that navigate to the item's definition in the rendered HTML documentation.

#### Scenario: User clicks a cell item ID in HTML matrix
- **WHEN** user clicks on a cell item ID (e.g., ARC-001) in an HTML matrix
- **THEN** browser navigates to the item's HTML page with fragment identifier (e.g., `../../architecture.html#ARC-001`)
- **AND** navigation opens in the same browser tab

#### Scenario: Cell item without source file
- **WHEN** a cell item has no `sourceFile` defined
- **THEN** the item ID renders as plain text (no link)

#### Scenario: Multiple items in a cell
- **WHEN** a matrix cell contains multiple items
- **THEN** each item ID renders as a separate clickable link

---

### Requirement: Links include source file tooltip
The matrix SHALL display the source file name as a tooltip when users hover over item links.

#### Scenario: User hovers over an item link
- **WHEN** user hovers over an item link in the matrix
- **THEN** a tooltip displays the source file path (e.g., "Source: architecture")

---

### Requirement: Link generation is context-aware
The system SHALL generate the same relative link path (`../../`) regardless of execution context, since matrices are always served from the Antora output site where pages sit at the component root.

#### Scenario: Link generation in Antora build context
- **WHEN** matrices are generated during Antora build
- **THEN** links use `../../` prefix to navigate from `_attachments/traceability/` to component root

#### Scenario: Link generation in CLI context
- **WHEN** matrices are generated via CLI (run-example.js)
- **THEN** links use `../../` prefix since matrices are served from the Antora output site

---

### Requirement: Source file paths are normalized
The system SHALL normalize item `sourceFile` paths by stripping any `pages/` prefix and `.adoc` extension at link resolution time.

#### Scenario: Parsing item from modules/ROOT/pages/architecture.adoc
- **WHEN** DocumentParser processes an item from `modules/ROOT/pages/architecture.adoc`
- **THEN** the item's `sourceFile` is stored as `architecture`

#### Scenario: Parsing item from modules/ROOT/pages/traceability/index.adoc
- **WHEN** DocumentParser processes an item from `modules/ROOT/pages/traceability/index.adoc`
- **THEN** the item's `sourceFile` is stored as `traceability/index`

#### Scenario: Parsing item with non-standard path
- **WHEN** DocumentParser processes an item from a path without `/pages/`
- **THEN** the item's `sourceFile` is stored as the basename without `.adoc` extension

---

### Requirement: Backward compatibility without LinkResolver
The system SHALL maintain existing matrix rendering behavior when no LinkResolver is provided.

#### Scenario: Matrix generation without LinkResolver
- **WHEN** MatrixGenerator is created without a LinkResolver
- **THEN** items render as plain text (no links)
- **AND** existing matrix HTML structure is preserved

---

### Requirement: Non-HTML matrix outputs unchanged
The system SHALL NOT modify CSV and JSON matrix outputs to include links.

#### Scenario: CSV matrix generation
- **WHEN** user requests CSV matrix output
- **THEN** output contains only item IDs and titles as plain text
- **AND** no link URLs are included

#### Scenario: JSON matrix generation
- **WHEN** user requests JSON matrix output
- **THEN** output contains item data as structured JSON
- **AND** no link URLs are included (optional metadata may be added)
