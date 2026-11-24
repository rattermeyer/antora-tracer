## MODIFIED Requirements

### Requirement: Orphaned state is derived from supersession and incoming functional links
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
- **THEN** the item SHALL NOT be orphaned, regardless of functional links

### Requirement: Validation warns about stale functional links
When a functional relationship involves an effectively superseded item at either endpoint, validation SHALL emit a non-blocking warning naming the item that still points at the superseded one, the relation type, the predecessor, and all direct successors.

#### Scenario: Advisory warning names affected items
- **WHEN** DES-007 `addresses` REQ-042
- **AND** REQ-043 supersedes REQ-042
- **THEN** validation SHALL warn that DES-007's `addresses` relation requires review
- **AND** SHALL name REQ-042 and REQ-043
- **AND** SHALL NOT fail validation solely because of this warning

#### Scenario: Warning covers a link stored with the superseded item as source
- **WHEN** TST-008 authors `verifies:REQ-042[]`, storing REQ-042 as the relationship's source
- **AND** REQ-043 supersedes REQ-042
- **THEN** validation SHALL warn that the relation requires review
- **AND** SHALL name REQ-042 and REQ-043

### Requirement: CLI reports supersession impact
The CLI SHALL provide `supersession check <ID>` that reports an item's successors and every functional link requiring review, listing the item that still points at the superseded one regardless of which endpoint the relationship stores as its source.

#### Scenario: Direct impact report
- **WHEN** `supersession check REQ-042` runs and REQ-043 supersedes REQ-042
- **THEN** the output SHALL name REQ-043 as a successor

#### Scenario: Source-side functional link is listed for review
- **WHEN** a test authors `verifies:REQ-042[]`
- **AND** REQ-043 supersedes REQ-042
- **THEN** `supersession check REQ-042` SHALL list the test's link under "Functional links requiring review"

#### Scenario: Optional transitive impact report
- **WHEN** `--impact` is passed
- **THEN** the output SHALL include the transitive impact radius
