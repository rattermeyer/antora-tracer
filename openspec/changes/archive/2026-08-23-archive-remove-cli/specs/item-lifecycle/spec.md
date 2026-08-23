## ADDED Requirements

### Requirement: archive moves a superseded item to the module's superseded page
The CLI SHALL provide `archive <ID>` that moves a superseded item's full block to a `superseded.adoc` page in the same module as the source file.

#### Scenario: Superseded item is archived
- **WHEN** REQ-129 is superseded
- **AND** its block lives in `requirements/pages/index.adoc`
- **THEN** `antora-tracer archive REQ-129` SHALL remove the block from `index.adoc`
- **AND** SHALL append it to `requirements/pages/superseded.adoc` (created if missing)
- **AND** the item's ID and content SHALL be preserved

#### Scenario: Non-superseded item is rejected
- **WHEN** REQ-100 is not superseded
- **THEN** `archive REQ-100` SHALL report an error and make no file change

#### Scenario: Unknown item is rejected
- **WHEN** the given ID does not exist in the graph
- **THEN** `archive` SHALL report an error and make no file change

### Requirement: remove deletes an orphaned item
The CLI SHALL provide `remove <ID>` that deletes an orphaned item's block after a normal confirmation prompt.

#### Scenario: Orphaned item is removed after confirmation
- **WHEN** REQ-042 is orphaned (superseded, no incoming functional links)
- **AND** the user confirms at the prompt
- **THEN** the block SHALL be removed from its source file

#### Scenario: Orphaned item declined leaves source unchanged
- **WHEN** the user declines at the prompt
- **THEN** no file SHALL change

#### Scenario: Non-orphaned item is rejected
- **WHEN** REQ-042 is superseded but still referenced by a functional link
- **THEN** `remove REQ-042` SHALL report an error and make no file change

### Requirement: remove deletes an isolated item with a stronger confirmation
The CLI SHALL provide `remove --isolated <ID>` (or an equivalent path) that deletes an isolated item's block only after the user types the item ID verbatim.

#### Scenario: Isolated item requires typed ID
- **WHEN** REQ-100 is isolated (zero relationships)
- **AND** the user confirms by typing the ID
- **THEN** the block SHALL be removed from its source file

#### Scenario: Typed ID mismatch leaves source unchanged
- **WHEN** the typed confirmation does not match the item ID
- **THEN** no file SHALL change

#### Scenario: Non-isolated item is rejected
- **WHEN** the item has at least one relationship
- **THEN** isolated removal SHALL report an error and make no file change

### Requirement: Block extent is detected before mutation
Before mutating a file, the CLI SHALL locate the item's full block from its `[#ID, item, …]` header to the matching closing `--` delimiter, and SHALL refuse to mutate when the extent is ambiguous.

#### Scenario: Malformed block is refused
- **WHEN** the closing delimiter cannot be found
- **THEN** the command SHALL report an error and make no file change
