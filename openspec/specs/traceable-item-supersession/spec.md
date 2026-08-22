# traceable-item-supersession

## Purpose

Traceable items may explicitly supersede predecessor items. Superseded items are omitted from current-state matrices, while functional links that still target them remain visible and are identified for review.

## Requirements

### Requirement: A successor declares a supersedes relationship
When a traceable item replaces another item, the successor SHALL declare a `supersedes` relationship to the predecessor.

#### Scenario: One successor replaces one predecessor
- **WHEN** REQ-043 declares `supersedes:REQ-042[]`
- **THEN** the graph SHALL contain `REQ-043 supersedes REQ-042`

#### Scenario: One predecessor is split into multiple successors
- **WHEN** REQ-043 and REQ-044 each supersede REQ-042
- **THEN** REQ-042 SHALL have both REQ-043 and REQ-044 as direct successors

#### Scenario: One successor merges multiple predecessors
- **WHEN** REQ-045 supersedes REQ-041 and REQ-042
- **THEN** both REQ-041 and REQ-042 SHALL have REQ-045 as a direct successor

### Requirement: The reverse superseded_by relationship is derivable
When a successor declares a `supersedes` relationship, the predecessor's `superseded_by` relationship SHALL be derivable from the graph.

#### Scenario: Reverse relationship is queryable
- **WHEN** REQ-043 declares `supersedes:REQ-042[]`
- **THEN** `REQ-042 superseded_by REQ-043` SHALL be queryable

### Requirement: Superseded state is derived from relationships
An item SHALL be effectively superseded when at least one valid incoming `supersedes` relationship targets it.

#### Scenario: Incoming supersedes relationship determines state
- **WHEN** REQ-043 supersedes REQ-042
- **THEN** REQ-042 SHALL be effectively superseded
- **AND** REQ-043 SHALL remain current unless another item supersedes it

### Requirement: Invalid supersession structures are rejected
If the supersession graph contains a self-reference, duplicate relationship, or cycle, then validation SHALL report an error.

#### Scenario: Self-supersession is invalid
- **WHEN** REQ-042 declares `supersedes:REQ-042[]`
- **THEN** validation SHALL report an error

#### Scenario: Supersession cycle is invalid
- **WHEN** REQ-043 supersedes REQ-042 and REQ-042 supersedes REQ-043
- **THEN** validation SHALL report a supersession-cycle error

### Requirement: Current-state matrices omit superseded items
When a current-state matrix is generated, the system SHALL omit effectively superseded items from both rows and columns by default.

#### Scenario: Superseded row is omitted
- **WHEN** REQ-043 supersedes REQ-042
- **AND** a matrix uses requirements as rows
- **THEN** REQ-042 SHALL NOT appear as a row

#### Scenario: Superseded column item is omitted
- **WHEN** ARC-043 supersedes ARC-042
- **AND** a matrix uses designs as columns
- **THEN** ARC-042 SHALL NOT appear in a matrix cell

### Requirement: Functional links to superseded items remain visible
When a relationship macro renders a functional relationship targeting a superseded item, the system SHALL retain the relationship and identify it as requiring review, naming every direct successor.

#### Scenario: Design link requires review
- **WHEN** DES-007 `addresses` REQ-042
- **AND** REQ-043 supersedes REQ-042
- **THEN** DES-007's relationship view SHALL still list REQ-042
- **AND** it SHALL mark the relationship as requiring review
- **AND** it SHALL name REQ-043 as a direct successor

### Requirement: History links are excluded from review worklists
Supersession history relationships SHALL NOT be classified as stale functional links.

#### Scenario: Valid supersedes link is not reported as suspect
- **WHEN** REQ-043 supersedes REQ-042
- **THEN** `REQ-043 supersedes REQ-042` SHALL NOT be included in the stale-link worklist

### Requirement: Superseded item blocks link to successors
When a superseded item's source block is rendered, the system SHALL display a superseded marker that links to every direct successor.

#### Scenario: Superseded block lists multiple successors
- **WHEN** REQ-043 and REQ-044 supersede REQ-042
- **THEN** the rendered REQ-042 block SHALL show a superseded marker
- **AND** the marker SHALL link to both REQ-043 and REQ-044

### Requirement: CLI reports supersession impact
When a supersession check is requested, the CLI SHALL report direct successors and incoming functional relationships requiring review.

#### Scenario: Direct impact report
- **WHEN** `antora-tracer supersession check REQ-042` runs
- **AND** REQ-043 supersedes REQ-042
- **AND** DES-007 still `addresses` REQ-042
- **THEN** the output SHALL name REQ-043 as a successor
- **AND** SHALL report DES-007 and its `addresses` relation as requiring review

#### Scenario: Optional transitive impact report
- **WHEN** `antora-tracer supersession check REQ-042 --impact` runs
- **THEN** the output SHALL include the transitive impact returned by the graph's impact analysis

### Requirement: Supersession checks do not modify source files
When a supersession check is requested, the CLI SHALL NOT modify any source file.

#### Scenario: Source remains unchanged
- **WHEN** `antora-tracer supersession check REQ-042` runs
- **THEN** every AsciiDoc source file SHALL remain byte-for-byte unchanged

### Requirement: Validation warns about stale functional links
When a functional relationship targets an effectively superseded item, validation SHALL emit a non-blocking warning naming the source item, relation type, predecessor, and all direct successors.

#### Scenario: Advisory warning names affected items
- **WHEN** DES-007 `addresses` REQ-042
- **AND** REQ-043 supersedes REQ-042
- **THEN** validation SHALL warn that DES-007's `addresses` relation requires review
- **AND** SHALL name REQ-042 and REQ-043
- **AND** SHALL NOT fail validation solely because of this warning
