## ADDED Requirements

### Requirement: Orphaned state is derived from supersession and incoming functional links
An effectively superseded item SHALL be considered orphaned when no incoming functional (non-history) relationship targets it.

#### Scenario: Superseded with no functional links is orphaned
- **WHEN** REQ-043 supersedes REQ-042
- **AND** no functional relationship targets REQ-042
- **THEN** REQ-042 SHALL be orphaned

#### Scenario: Superseded but still referenced is not orphaned
- **WHEN** REQ-043 supersedes REQ-042
- **AND** ARC-001 declares `addresses:REQ-042[]`
- **THEN** REQ-042 SHALL NOT be orphaned

#### Scenario: History links alone leave an item orphaned
- **WHEN** REQ-043 supersedes REQ-042
- **AND** the only incoming relationship to REQ-042 is `REQ-043 supersedes REQ-042`
- **THEN** REQ-042 SHALL be orphaned

#### Scenario: Non-superseded items are never orphaned
- **WHEN** an item is not superseded
- **THEN** the item SHALL NOT be orphaned, regardless of incoming links
