# Relationship Canonicalization

## Purpose

Collapse valid inverse-authored relations into one canonical bidirectional edge after endpoint resolution, so scoped relationships whose targets are only known after parsing do not surface as duplicate-relationship validation errors.

## Requirements

### Requirement: Deferred inverse relations deduplicate after endpoint resolution
When the graph resolves the endpoints of reciprocal primary and reverse-authored relations, it SHALL store one canonical bidirectional relationship and SHALL NOT report the pair as a duplicate.

#### Scenario: Reciprocal relations are authored in separate scoped documents
- **WHEN** one document defines `OBJ-001 leads_to REQ-001` before `REQ-001` is available
- **AND** another document defines `REQ-001 is_derived_from OBJ-001`
- **AND** graph canonicalization resolves both endpoint identities
- **THEN** the graph stores one canonical `OBJ-001 leads_to REQ-001` relationship marked bidirectional
- **AND** validation reports no duplicate relationship error
