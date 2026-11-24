## RENAMED Requirements

- FROM: `### Requirement: Orphaned state is derived from supersession and incoming functional links`
- TO: `### Requirement: Orphaned state is derived from supersession and functional links`

## MODIFIED Requirements

### Requirement: Orphaned state is derived from supersession and functional links
An effectively superseded item SHALL be considered orphaned when no functional (non-history) relationship involves it at either endpoint. A functional link counts whether the superseded item is the relationship's stored source or its stored target.

#### Scenario: Superseded with no functional links is orphaned
- **WHEN** REQ-043 supersedes REQ-042
- **AND** no functional relationship involves REQ-042
- **THEN** REQ-042 SHALL be orphaned

#### Scenario: Superseded but still referenced is not orphaned
- **WHEN** REQ-043 supersedes REQ-042
- **AND** ARC-001 declares `addresses:REQ-042[]`
- **THEN** REQ-042 SHALL NOT be orphaned

#### Scenario: Superseded item as the stored source of a functional link is not orphaned
- **WHEN** REQ-043 supersedes REQ-042
- **AND** a test authors `verifies:REQ-042[]`, storing a relationship whose source is REQ-042
- **THEN** REQ-042 SHALL NOT be orphaned

#### Scenario: History links alone leave an item orphaned
- **WHEN** REQ-043 supersedes REQ-042
- **AND** the only relationship involving REQ-042 is `REQ-043 supersedes REQ-042`
- **THEN** REQ-042 SHALL be orphaned

#### Scenario: Non-superseded items are never orphaned
- **WHEN** an item is not superseded
- **THEN** the item SHALL NOT be orphaned, regardless of incoming links
