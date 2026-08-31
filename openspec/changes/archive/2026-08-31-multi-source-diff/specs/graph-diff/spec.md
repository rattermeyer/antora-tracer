## MODIFIED Requirements

### Requirement: Diff classifies items by stable ID
When two graph snapshots are compared, the diff SHALL classify each item as added, removed, or modified based on its stable ID, scoped to the item's component and version when present.

#### Scenario: Added and removed items
- **WHEN** graph A contains `REQ-041` and `REQ-042`
- **AND** graph B contains `REQ-042` and `REQ-043`
- **THEN** the delta SHALL report `REQ-043` as added
- **AND** SHALL report `REQ-041` as removed

#### Scenario: Surviving item with no changes is not reported
- **WHEN** `REQ-042` has identical fields in both graphs
- **THEN** `REQ-042` SHALL NOT appear in the delta

#### Scenario: Same ID in different components is not conflated
- **WHEN** graph A contains `REQ-001` in component `foo`
- **AND** graph B contains `REQ-001` in component `bar`
- **THEN** the delta SHALL report the `foo` item as removed and the `bar` item as added
- **AND** SHALL NOT report a modified item
