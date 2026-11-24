## RENAMED Requirements

- FROM: `### Requirement: query orphaned — find superseded items with no incoming functional links`
- TO: `### Requirement: query orphaned — find superseded items with no functional links`

## MODIFIED Requirements

### Requirement: query orphaned — find superseded items with no functional links
The CLI SHALL provide `query orphaned` that returns all effectively superseded items that are orphaned. An item is orphaned when no functional (non-history) relationship involves it at either endpoint — whether the superseded item is the relationship's stored source or its stored target.

#### Scenario: Orphaned items exist
- **WHEN** user runs `antora-tracer query orphaned`
- **AND** REQ-042 is superseded by REQ-043
- **AND** no functional relationship involves REQ-042
- **THEN** output lists REQ-042 including its role, title, source file, and direct successors

#### Scenario: Superseded but still in use is excluded
- **WHEN** REQ-042 is superseded by REQ-043
- **AND** ARC-001 still declares `addresses:REQ-042[]`
- **THEN** `query orphaned` does NOT list REQ-042

#### Scenario: Superseded item as the stored source of a functional link is excluded
- **WHEN** REQ-042 is superseded by REQ-043
- **AND** a test authors `verifies:REQ-042[]`, storing REQ-042 as the relationship's source
- **THEN** `query orphaned` does NOT list REQ-042

#### Scenario: History links do not prevent orphan status
- **WHEN** REQ-042 is superseded by REQ-043
- **AND** the only relationship involving REQ-042 is `REQ-043 supersedes REQ-042`
- **THEN** `query orphaned` lists REQ-042

#### Scenario: Orphaned filtered by role
- **WHEN** user runs `antora-tracer query orphaned --role requirement`
- **THEN** output lists only orphaned items whose role matches `requirement`
