## REMOVED Requirements

### Requirement: Supersession appears as added and removed

## ADDED Requirements

### Requirement: The diff does not attempt rename detection
The diff SHALL NOT attempt content-similarity rename detection.

#### Scenario: No rename heuristic
- **WHEN** two graphs differ only in a renumbered item with similar content
- **THEN** the diff SHALL NOT infer a rename

### Requirement: A superseded predecessor is reported as removed and its successor as added
A superseded predecessor SHALL appear as removed and its successor as added, with the `supersedes` relationship reported as a new relationship.

#### Scenario: Superseded pair
- **WHEN** graph B contains `REQ-043` with `supersedes:REQ-042[]` and `REQ-042` is absent
- **THEN** `REQ-042` SHALL be reported as removed
- **AND** `REQ-043` SHALL be reported as added
- **AND** the `supersedes` relationship SHALL be reported as a new relationship
