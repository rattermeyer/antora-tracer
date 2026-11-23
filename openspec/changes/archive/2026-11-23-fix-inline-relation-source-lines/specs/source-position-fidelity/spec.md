## ADDED Requirements

### Requirement: Inline relationship macros report their own file line

The system SHALL report the source line of a relationship declared by an inline body macro as the
1-based line number, in the source file's own numbering, of the line containing that macro. The
reported line SHALL NOT depend on how much leading or interior whitespace the item body contains.

#### Scenario: Relation on the first body line

- **WHEN** an item's body begins with `satisfies:REQ-001[]` immediately after the opening delimiter
- **THEN** the relationship's `line` is the file line of that macro

#### Scenario: Blank lines before the relation

- **WHEN** one or more blank lines separate the opening delimiter from the macro
- **THEN** the relationship's `line` is still the file line of that macro
- **AND** the reported line SHALL NOT decrease as blank lines are added

#### Scenario: Relation in a later item of a multi-item document

- **WHEN** a document defines several items and a later item's body contains a relation macro
- **THEN** the relationship's `line` is that macro's file line, not a line relative to the item

#### Scenario: Multiple relations in one body

- **WHEN** an item body contains relation macros on different lines
- **THEN** each relationship reports the line of its own macro

### Requirement: Position derivation uses file-absolute offsets

The system SHALL derive a relationship's line from the macro's absolute character offset in the
source document, rather than from a line count over the item body with the header line added.

#### Scenario: Body trimming does not affect reported positions

- **WHEN** an item body is trimmed of surrounding whitespace to produce `Item.content`
- **THEN** the reported line for each of its relations is unaffected by the trimming

#### Scenario: Header-attribute relations keep the header line

- **WHEN** a relation is declared as a header attribute rather than a body macro
- **THEN** its `line` remains the line of the item header

### Requirement: Positional warnings name the authored line

The system SHALL report the file line of the relation's macro in every diagnostic derived from a
relationship's position, including `dangling_link` and `invalid_relation` warnings from graph
validation and the source line printed by relationship queries.

#### Scenario: Dangling target names the macro line

- **WHEN** an item body declares `satisfies:UNKNOWN-001[]` on a known line and `UNKNOWN-001` does not exist
- **THEN** validation reports the dangling link with that macro's file line

#### Scenario: Invalid relation names the macro line

- **WHEN** a relation is authored on a known line whose type is not allowed for the endpoint roles
- **THEN** validation reports the invalid relation with that macro's file line

#### Scenario: Relationship query prints the macro line

- **WHEN** a consumer queries the reverse or connected relationships of an item
- **THEN** each relationship is listed with its macro's file line
