## MODIFIED Requirements

### Requirement: archive moves a superseded item to the module's superseded page
The CLI SHALL provide `archive <ID>` that moves a superseded item's full block to a `superseded.adoc` page in the same module as the source file. When the archived block was the source file's only content, the CLI SHALL remove the now-empty source file, so the block is moved rather than copied.

#### Scenario: Superseded item is archived
- **WHEN** REQ-129 is superseded
- **AND** its block lives in `requirements/pages/index.adoc`
- **THEN** `antora-tracer archive REQ-129` SHALL remove the block from `index.adoc`
- **AND** SHALL append it to `requirements/pages/superseded.adoc` (created if missing)
- **AND** the item's ID and content SHALL be preserved

#### Scenario: Source file holding only the archived item is removed
- **WHEN** the item's block is the only content of its source file
- **AND** `archive <ID>` moves the block to `superseded.adoc`
- **THEN** the source file SHALL be removed
- **AND** no zero-byte `.adoc` SHALL remain at its path

#### Scenario: Source file holding other content is kept
- **WHEN** the item's source file also holds other items or prose
- **AND** `archive <ID>` removes the item's block
- **THEN** the source file SHALL remain, with the block removed and its other content intact

#### Scenario: Non-superseded item is rejected
- **WHEN** REQ-100 is not superseded
- **THEN** `archive REQ-100` SHALL report an error and make no file change

#### Scenario: Unknown item is rejected
- **WHEN** the given ID does not exist in the graph
- **THEN** `archive` SHALL report an error and make no file change
