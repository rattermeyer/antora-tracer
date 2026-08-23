# bidirectional-relationship-merge

## Purpose

Detect complementary directed relationship pairs (e.g., A `leads_to` B and B `is_derived_from` A) and merge them into a single bidirectional edge. Prevents double-counting in coverage stats, false circular-reference warnings, and duplicate edges in Neo4j exports and GraphViz diagrams.

## Requirements

### Requirement: Reverse-authored relationships are detected
The system SHALL detect when a newly added relationship is authored with the reverse of an existing relationship's type — the existing edge goes from B to A with a type whose declared `reverse` equals the new edge's type.

#### Scenario: Reverse-authored edge canonicalizes to the existing primary edge
- **WHEN** `relations` declares `leads_to` with reverse `is_derived_from`
- **AND** the graph already contains `UC-003 leads_to REQ-001`
- **AND** `addRelationship` is called with `{ fromId: "REQ-001", type: "is_derived_from", targetId: "UC-003" }`
- **THEN** no second edge is stored
- **AND** the existing `UC-003 leads_to REQ-001` relationship is marked `bidirectional: true`
- **AND** no warning is emitted

### Requirement: No second edge is stored for a complementary pair
If a newly added relationship forms a complementary pair with an existing relationship, then the system SHALL NOT store a second edge. The canonical primary edge is retained with its original metadata (sourceFile, line), and no warning is emitted.

Merging is driven by the `reverse` declaration in `relations` (config).

#### Scenario: Single-direction relationship is stored normally
- **WHEN** `addRelationship` is called with `{ fromId: "UC-003", type: "leads_to", targetId: "REQ-001" }`
- **AND** no edge for that pair exists in the graph
- **THEN** the relationship is stored as a regular directed edge with `bidirectional` unset or `false`

#### Scenario: Same-type cycle is NOT merged
- **WHEN** the graph already contains `A depends_on B`
- **AND** `addRelationship` is called with `{ fromId: "B", type: "depends_on", targetId: "A" }`
- **THEN** the two edges are NOT merged (same type, not complementary types)
- **AND** both `A depends_on B` and `B depends_on A` are stored separately

#### Scenario: Reverse type with no config entry is stored as-is
- **WHEN** a relationship type has no `reverse` declaration in `relations`
- **AND** no complementary edge exists
- **THEN** the relationship is stored as a regular directed edge (no canonicalization, no merge)
