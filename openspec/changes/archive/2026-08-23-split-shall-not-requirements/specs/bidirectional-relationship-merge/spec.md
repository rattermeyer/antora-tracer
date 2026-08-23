## REMOVED Requirements

### Requirement: Bidirectional relationship pairs are merged into a single edge

## ADDED Requirements

### Requirement: Reverse-authored relationships are detected
The system SHALL detect when a newly added relationship is authored with the reverse of an existing relationship's type — the existing edge goes from B to A with a type whose declared `reverse` equals the new edge's type.

#### Scenario: Reverse-authored relationship is detected
- **WHEN** `relations` declares `leads_to` with reverse `is_derived_from`
- **AND** `addRelationship` is called with `is_derived_from` in the opposite direction
- **THEN** the system SHALL detect the complementary pair

### Requirement: No second edge is stored for a complementary pair
If a newly added relationship forms a complementary pair with an existing relationship, then the system SHALL NOT store a second edge.

#### Scenario: Complementary pair is not duplicated
- **WHEN** the graph already contains `UC-003 leads_to REQ-001`
- **AND** `addRelationship` is called with `is_derived_from` in the opposite direction
- **THEN** the system SHALL NOT store a second edge
- **AND** the canonical primary edge SHALL be retained with its original metadata
