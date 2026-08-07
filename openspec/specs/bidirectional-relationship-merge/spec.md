# bidirectional-relationship-merge

## Purpose

Detect complementary directed relationship pairs (e.g., A `leads_to` B and B `is_derived_from` A) and merge them into a single bidirectional edge. Prevents double-counting in coverage stats, false circular-reference warnings, and duplicate edges in Neo4j exports and GraphViz diagrams.

## Requirements

### Requirement: Bidirectional relationship pairs are merged into a single edge
The system SHALL detect when a newly added relationship forms a complementary pair with an existing relationship — the existing edge goes from B to A with a type that is the configured inverse of the new edge's type — and merge them into a single bidirectional edge instead of storing two directed edges.

Merging SHALL follow first-writer-wins: the first relationship stored remains as the canonical entry with its original metadata (sourceFile, line), and the second call to `addRelationship` is silently dropped. No warning is emitted.

#### Scenario: User-defined inverse pair is merged
- **WHEN** the graph already contains `UC-003 leads_to REQ-001`
- **AND** `inverseLabels` config maps `leads_to` → `is_derived_from`
- **AND** `addRelationship` is called with `{ fromId: "REQ-001", type: "is_derived_from", targetId: "UC-003" }`
- **THEN** the new relationship is NOT stored as a second edge
- **AND** the existing `UC-003 leads_to REQ-001` relationship is marked `bidirectional: true`
- **AND** no warning is emitted

#### Scenario: Primary type wins even when inverse is processed first
- **WHEN** `inverseLabels` config maps `leads_to` → `is_derived_from`
- **AND** REQUIREMENTS is processed first, so `REQ-051 is_derived_from UC-009` arrives before `UC-009 leads_to REQ-051`
- **THEN** when `UC-009 leads_to REQ-051` arrives, the system SHALL detect that `leads_to` is the primary type (key in `inverseLabels`)
- **AND** the existing inverse `is_derived_from` SHALL be removed
- **AND** the new `leads_to` relationship SHALL be stored as canonical, marked `bidirectional: true`
- **AND** the canonical edge SHALL be `UC-009 leads_to REQ-051` regardless of processing order

#### Scenario: User-defined inverse pair is merged

#### Scenario: Single-direction relationship is stored normally
- **WHEN** `addRelationship` is called with `{ fromId: "UC-003", type: "leads_to", targetId: "REQ-001" }`
- **AND** no inverse relationship exists in the graph
- **THEN** the relationship is stored as a regular directed edge with `bidirectional` unset or `false`

#### Scenario: Inverse type not configured
- **WHEN** `addRelationship` is called with a type that has no entry in `inverseLabels` config or `INVERSE_MAP`
- **AND** an edge exists in the opposite direction with a different type
- **THEN** both edges are stored independently (no merge)
- **AND** each edge is a regular directed relationship

#### Scenario: Same-type cycle is NOT merged
- **WHEN** the graph already contains `A depends B`
- **AND** `addRelationship` is called with `{ fromId: "B", type: "depends", targetId: "A" }`
- **AND** `inverseLabels` maps `depends` → `depended-by`
- **THEN** the two edges are NOT merged (they have the same type, not complementary types)
- **AND** both `A depends B` and `B depends A` are stored separately

#### Scenario: Inverse pair with compile-time INVERSE_MAP
- **WHEN** `inverseLabels` config does not define an inverse for type `addresses`
- **AND** the compile-time `INVERSE_MAP` maps `addresses` → `addressed-by`
- **AND** the graph already contains `ARC-001 addresses REQ-001`
- **AND** `addRelationship` is called with `{ fromId: "REQ-001", type: "addressed-by", targetId: "ARC-001" }`
- **THEN** the compile-time mapping is used and the pair is merged

#### Scenario: Reverse config lookup resolves primary type from inverse
- **WHEN** `inverseLabels` config maps `leads_to` → `is_derived_from`
- **AND** the graph already contains `UC-007 leads_to REQ-109`
- **AND** `addRelationship` is called with `{ fromId: "REQ-109", type: "is_derived_from", targetId: "UC-007" }`
- **THEN** the system SHALL find `leads_to` as the primary type by searching `inverseLabels` entries in reverse
- **AND** the existing `UC-007 leads_to REQ-109` relationship is marked `bidirectional: true`
