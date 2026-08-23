## MODIFIED Requirements

### Requirement: query isolated — find items with no relationships
The CLI SHALL provide `query isolated` that returns all items that have neither incoming nor outgoing relationships in the graph.

#### Scenario: Isolated items exist
- **WHEN** user runs `antora-tracer query isolated`
- **THEN** output lists every item with no relationships, including its role, title, and source file

#### Scenario: No isolated items
- **WHEN** user runs `antora-tracer query isolated` and every item has at least one relationship
- **THEN** output is empty and exit code is 0

#### Scenario: Isolated filtered by role
- **WHEN** user runs `antora-tracer query isolated --role requirement`
- **THEN** output lists only isolated items whose role matches `requirement`

## ADDED Requirements

### Requirement: query orphaned — find superseded items with no incoming functional links
The CLI SHALL provide `query orphaned` that returns all effectively superseded items that have no incoming functional (non-history) relationships.

#### Scenario: Orphaned items exist
- **WHEN** user runs `antora-tracer query orphaned`
- **AND** REQ-042 is superseded by REQ-043
- **AND** no functional relationship targets REQ-042
- **THEN** output lists REQ-042 including its role, title, source file, and direct successors

#### Scenario: Superseded but still in use is excluded
- **WHEN** REQ-042 is superseded by REQ-043
- **AND** ARC-001 still declares `addresses:REQ-042[]`
- **THEN** `query orphaned` does NOT list REQ-042

#### Scenario: History links do not prevent orphan status
- **WHEN** REQ-042 is superseded by REQ-043
- **AND** the only incoming relationship to REQ-042 is `REQ-043 supersedes REQ-042`
- **THEN** `query orphaned` lists REQ-042

#### Scenario: Orphaned filtered by role
- **WHEN** user runs `antora-tracer query orphaned --role requirement`
- **THEN** output lists only orphaned items whose role matches `requirement`
