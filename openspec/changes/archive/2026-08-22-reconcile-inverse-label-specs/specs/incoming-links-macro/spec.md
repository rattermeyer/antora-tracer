## RENAMED Requirements

- FROM: `### Requirement: Inverse relation type labels`
- TO: `### Requirement: Incoming groups use the reverse relation type`

## MODIFIED Requirements

### Requirement: Incoming groups use the reverse relation type
The system SHALL group incoming relationships in `traceability:incoming[]` by the reverse relation type — the declared `reverse` of the relationship's type — so each group heading names the relation from the target item's perspective.

#### Scenario: Incoming group heading uses the declared reverse
- **WHEN** `relations` declares `leads_to` with reverse `is_derived_from`
- **AND** an item is the target of a `leads_to` relationship
- **THEN** the `traceability:incoming[]` group heading SHALL be `is_derived_from`

## REMOVED Requirements

### Requirement: Fallback to raw type name when no inverse mapping exists
