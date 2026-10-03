# Functional Siblings

## Purpose

Provide sibling queries over the traceability graph: given an item, find other items that share typed neighbors with it — the review context that answers "who else relates to what this item relates to?"

## Requirements

### Requirement: Sibling query returns items sharing typed neighbors
The system SHALL provide a sibling query for an item that returns every other item connected to at least one common neighbor, where the connection uses the same relation type on both sides.
Traversal SHALL be undirected: because relations are bidirectional, an item's neighbors include both outgoing and incoming relation targets, regardless of edge authoring direction.

#### Scenario: Siblings via shared target
- **WHEN** PRQ-004 and PRQ-009 both declare a `validates` relationship to REQ-072
- **THEN** querying siblings of PRQ-004 returns PRQ-009

#### Scenario: Siblings via shared source
- **WHEN** PRQ-002 declares `validates` relationships to both REQ-087 and REQ-088
- **THEN** querying siblings of REQ-087 returns REQ-088

#### Scenario: Undirected traversal
- **WHEN** item A points at item B and item C also points at B, and additionally item D points at A
- **THEN** querying siblings of A returns C (shared neighbor B) and does not return D (D is a neighbor of A, not a sibling of A via a shared neighbor)

#### Scenario: Item with no shared neighbors
- **WHEN** querying siblings of an item whose neighbors are not connected to any other item
- **THEN** the result is empty and the query succeeds

#### Scenario: Unknown item ID
- **WHEN** querying siblings of an item ID that does not exist in the graph
- **THEN** the system reports that the item was not found

### Requirement: Sibling results carry shared-neighbor context
Each sibling result SHALL include the IDs of the shared neighbors that connect the sibling to the queried item, so a reviewer can see why the item is a sibling.

#### Scenario: Multiple shared neighbors
- **WHEN** PRQ-010 and the queried item share two neighbors REQ-072 and REQ-093
- **THEN** the result for PRQ-010 lists both REQ-072 and REQ-093 as shared neighbors

#### Scenario: Single shared neighbor
- **WHEN** PRQ-009 and the queried item share exactly one neighbor
- **THEN** the result for PRQ-009 lists exactly that one shared neighbor

### Requirement: Sibling query supports relation-type filtering
The sibling query SHALL accept an optional relation type.
When given, only neighbors connected through that relation type on both sides contribute to sibling discovery.
When omitted, neighbors connected through any relation type contribute.

#### Scenario: Filtered to a relation type
- **WHEN** PRQ-004 shares neighbor REQ-072 via `validates` and TEST-020 shares REQ-072 via `verifies`
- **THEN** querying siblings of PRQ-004 with relation type `validates` returns TEST-020 only if the filter is omitted; with the filter set to `validates`, TEST-020 is excluded

#### Scenario: Relation type with no shared neighbors
- **WHEN** querying siblings with a relation type through which no neighbor is shared
- **THEN** the result is empty and the query succeeds

### Requirement: Sibling results include supersession status
Each sibling result SHALL indicate whether the sibling is superseded, so stale siblings are distinguishable during review.

#### Scenario: Superseded sibling
- **WHEN** a sibling item has been superseded by a successor item
- **THEN** the sibling result marks it as superseded and identifies the successor

#### Scenario: Current sibling
- **WHEN** a sibling item has not been superseded
- **THEN** the sibling result marks it as current
