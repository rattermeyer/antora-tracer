## MODIFIED Requirements

### Requirement: remove deletes an orphaned item
The CLI SHALL provide `remove <ID>` that deletes an orphaned item's block after a normal confirmation prompt. An item is orphaned when it is superseded and no functional (non-history) relationship involves it at either endpoint.

#### Scenario: Orphaned item is removed after confirmation
- **WHEN** REQ-042 is orphaned (superseded, no functional links at either endpoint)
- **AND** the user confirms at the prompt
- **THEN** the block SHALL be removed from its source file

#### Scenario: Orphaned item declined leaves source unchanged
- **WHEN** the user declines at the prompt
- **THEN** no file SHALL change

#### Scenario: Non-orphaned item is rejected
- **WHEN** REQ-042 is superseded but still referenced by a functional link
- **THEN** `remove REQ-042` SHALL report an error and make no file change
