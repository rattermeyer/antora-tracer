## MODIFIED Requirements

### Requirement: traceability:links[] macro renders combined outgoing and incoming links
The scenario "only the incoming groups render with inverse labels" SHALL read "only the incoming groups render with reverse-type labels".

#### Scenario: Incoming groups render with reverse-type labels
- **WHEN** `traceability:links[]` renders combined outgoing and incoming links
- **THEN** the incoming groups render with reverse-type labels
