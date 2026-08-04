# circular-reference-detection

## Purpose

Detect circular references in the traceability graph during validation. A circular reference is a cycle in the directed relationship graph. The detection skips auto-generated inverse relationships to avoid false positives and reports cycle paths in human-readable form.

## Requirements

### Requirement: Circular reference detection in graph validation
The system SHALL detect circular references in the traceability graph during validation via `validate()`. A circular reference is a cycle in the directed relationship graph (e.g., A → B → A, or A → B → C → A). Self-referencing relationships (A → A) SHALL also be detected as cycles. Auto-generated inverse relationships SHALL be skipped during cycle detection to avoid false positives.

#### Scenario: Direct circular reference detected
- **WHEN** the graph contains REQ-001 → REQ-002 and REQ-002 → REQ-001
- **THEN** `validate()` returns an error containing `Circular reference detected: REQ-001 -> REQ-002 -> REQ-001`
- **AND** the cycle is reported exactly once

#### Scenario: Indirect (3-node) circular reference detected
- **WHEN** the graph contains REQ-001 → REQ-002, REQ-002 → REQ-003, and REQ-003 → REQ-001
- **THEN** `validate()` returns an error containing the full cycle path `REQ-001 -> REQ-002 -> REQ-003 -> REQ-001`

#### Scenario: Self-referencing cycle detected
- **WHEN** an item has a relationship to itself (A → A)
- **THEN** `validate()` reports it as a circular reference

#### Scenario: Auto-generated inverse relationships are skipped
- **WHEN** the graph has an explicit `addresses` relationship from ARC-001 to REQ-001
- **AND** the system auto-generates an inverse `addressed-by` relationship from REQ-001 to ARC-001
- **THEN** cycle detection does NOT follow the auto-generated inverse edge
- **AND** no false circular reference is reported

#### Scenario: Acyclic graph produces no circular errors
- **WHEN** the graph contains only forward-directed relationships with no cycles
- **THEN** `validate()` produces zero circular reference errors
