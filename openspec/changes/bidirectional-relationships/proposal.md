# Change Proposal: Bidirectional Relationships with Auto-Generated Inverse Macros (Phase 3)

## Summary

Implement auto-generated inverse relationships for all traceability relationship types, enabling bidirectional querying without requiring users to explicitly define both directions. This eliminates redundancy, prevents inconsistencies, and enables more natural queries like "which designs address this requirement?" or "which implementations satisfy this requirement?".

## Problem Statement

Currently, the Requirements Traceability Extension only supports **unidirectional relationships**:

```asciidoc
[design, id=DES-001]
====
The authentication system design.
addresses:REQ-001[]  # DES-001 addresses REQ-001
====

[req, id=REQ-001]
====
User authentication requirement.
# No way to express "this requirement is addressed by DES-001"
====
```

This creates several problems:

1. **Incomplete Queries**: Users can ask "what does this design address?" but cannot directly ask "what addresses this requirement?"
2. **Redundant Definitions**: To enable bidirectional queries, users would need to manually define both directions, which is error-prone
3. **Inconsistent Data**: Manual bidirectional definitions can get out of sync
4. **Limited Matrix Types**: Cannot generate inverse matrices (e.g., implementation-to-requirement) because the inverse relationships don't exist

## Solution Overview

Implement **auto-generated inverse relationships** where defining a relationship in one direction automatically creates the inverse relationship:

```asciidoc
[design, id=DES-001]
====
The authentication system design.
addresses:REQ-001[]
# Automatically creates: REQ-001 addressed-by DES-001
====

# Users can now query from either direction:
# - getDesignsForRequirement(REQ-001) → [DES-001]
# - getRequirementsForDesign(DES-001) → [REQ-001]
```

### Relationship Type Mapping

| Primary Relationship | Inverse Relationship | Direction | Description |
|---------------------|---------------------|-----------|-------------|
| `satisfies` | `satisfied-by` | impl → req | Implementation satisfies requirement |
| `tests` | `tested-by` | test → impl | Test tests implementation |
| `verifies` | `verified-by` | test → req | Test verifies requirement |
| `documents` | `documented-by` | doc → req | Document documents requirement |
| `depends` | `depended-by` | any → any | Generic dependency |
| `requires` | `required-by` | any → any | Generic requirement |
| `addresses` | `addressed-by` | design → req | Design addresses requirement |
| `implements` | `implemented-by` | impl → design | Implementation implements design |
| `composed-of` | `part-of` | design → design | Design is composed of other designs |
| `depends-on` | `depended-by` | design → design | Design depends on other designs |

### Key Design Decisions

1. **Auto-Generation Only**: Inverse relationships are automatically generated from primary relationships. Users **cannot** explicitly define inverse relationships in source files.

2. **Explicit Dual Storage**: Both the primary and inverse relationships are stored as first-class relationships in the graph, ensuring O(1) query performance for both directions.

3. **Read-Only Inverses**: Inverse relationships are internal implementation details. Users interact with them through query methods, not by defining them directly.

4. **Matrix Generation**: Generate both unidirectional and inverse matrices (e.g., `matrix-req-impl.csv` and `matrix-impl-req.csv`).

## Goals

### Primary Goals
- ✅ Enable bidirectional querying without user-defined inverse relationships
- ✅ Maintain O(1) query performance for both directions
- ✅ Generate inverse matrices (impl-req, design-req, test-impl, etc.)
- ✅ Maintain 100% backward compatibility with existing code
- ✅ Prevent duplicate or inconsistent relationship definitions

### Secondary Goals
- ✅ Add convenience query methods for all inverse relationship types
- ✅ Update coverage reports to leverage bidirectional relationships
- ✅ Enable transitive coverage calculation (Phase 3B)
- ✅ Document the bidirectional relationship model

### Non-Goals
- ❌ Allow users to explicitly define inverse relationships in source files
- ❌ Implement transitive relationship traversal (separate feature)
- ❌ Visual hierarchy in matrices (Phase 3C)
- ❌ Section-based node parsing (separate Phase 3 change)

## Success Criteria

1. **Auto-Generation**: Defining `addresses:REQ-001[]` in a design automatically creates the inverse `addressed-by` relationship from the requirement to the design

2. **Bidirectional Queries**: All relationship types can be queried from both directions:
   - `getImplementationsForRequirement(reqId)` - existing, works via traversal
   - `getRequirementsForImplementation(implId)` - new, uses inverse relationships
   - `getDesignsForRequirement(reqId)` - existing
   - `getRequirementsForDesign(designId)` - new, uses inverse relationships

3. **Inverse Matrices**: New inverse matrices are generated:
   - `matrix-impl-req.csv/html` - Which requirements each implementation satisfies
   - `matrix-design-req.csv/html` - Which requirements each design addresses
   - `matrix-test-impl.csv/html` - Which implementations each test tests
   - `matrix-test-req.csv/html` - Which requirements each test verifies

4. **Performance**: All queries maintain O(1) or O(log n) performance characteristics

5. **Backward Compatibility**: All existing tests pass without modification

6. **No Duplicates**: The system prevents duplicate inverse relationships

7. **Circular Reference Handling**: Circular relationships are detected and warned about during validation

## Stakeholders

- **Users**: Documentation writers, architects, and developers who want to trace relationships from both directions
- **Maintainers**: Extension developers who need to understand the relationship model
- **Testers**: Users who verify bidirectional relationship correctness

## Dependencies

- Phase 2: Design Concept Support (completed and archived)
- Existing relationship parsing infrastructure
- Existing graph storage and query infrastructure
- Existing matrix generation infrastructure

## Risks

1. **Performance Impact**: Storing 2x relationships could impact memory usage
   - *Mitigation*: Relationships are lightweight objects; 2x storage is acceptable for typical use cases

2. **Complexity Increase**: More relationship types to manage
   - *Mitigation*: Clear naming conventions and consistent patterns reduce cognitive load

3. **Backward Compatibility**: Existing code might assume unidirectional relationships
   - *Mitigation*: Keep all existing query methods; add new inverse-specific methods

4. **Circular References**: Auto-generating inverses could create circular reference loops
   - *Mitigation*: Detect and warn about circular references during validation; don't prevent them (they represent real dependencies)

5. **User Confusion**: Users might be confused about which direction to use
   - *Mitigation*: Clear documentation with examples; primary relationships are for definition, inverse for querying

## Open Questions

1. **Naming Convention**: Should `depends-on` inverse be `depended-by` or `depends-on-by`?
   - *Proposed*: `depended-by` (consistent with past-participle pattern)

2. **Circular Reference Storage**: If A depends-on B and B depends-on A, we create 4 relationships. Is this acceptable?
   - *Proposed*: Yes, it accurately represents the bidirectional dependency

3. **Matrix Strategy**: Should we generate separate inverse matrices, or make existing matrices bidirectional?
   - *Proposed*: Generate separate inverse matrices (clearer semantics)

4. **Query Method Naming**: Should we add convenience methods like `getAddressedBy(reqId)` or rely on generic `getRelationships(reqId, 'addressed-by')`?
   - *Proposed*: Both - convenience methods for common queries, generic method for flexibility

## Next Steps

1. Review and approve this proposal
2. Create detailed design document
3. Create specifications for:
   - Relationship type definitions
   - Storage and indexing strategy
   - Query API
   - Matrix generation changes
   - Backward compatibility requirements
4. Create task breakdown
5. Implement changes
6. Test thoroughly
7. Update documentation
8. Archive change

## Related Work

- Phase 2: Design Concept Support (archived 2026-07-19) - Added design nodes and initial relationship types
- Phase 1: Requirements Traceability (archived 2026-07-17) - Core requirement, implementation, test, document nodes
- TypeScript Refactoring (archived 2026-07-16) - Type-safe codebase foundation

## Appendix: Relationship Type Reference

### Existing Unidirectional Types (Phase 1 & 2)
- `satisfies`: Implementation → Requirement
- `tests`: Test → Implementation
- `verifies`: Test → Requirement
- `documents`: Document → Requirement
- `depends`: Any → Any (generic dependency)
- `requires`: Any → Any (generic requirement)
- `addresses`: Design → Requirement (Phase 2)
- `implements`: Implementation → Design (Phase 2)
- `composed-of`: Design → Design (Phase 2)
- `depends-on`: Design → Design (Phase 2)

### New Inverse Types (Phase 3)
- `satisfied-by`: Requirement → Implementation
- `tested-by`: Implementation → Test
- `verified-by`: Requirement → Test
- `documented-by`: Requirement → Document
- `depended-by`: Any → Any
- `required-by`: Any → Any
- `addressed-by`: Requirement → Design
- `implemented-by`: Design → Implementation
- `part-of`: Design → Design
- `depended-by`: Design → Design
