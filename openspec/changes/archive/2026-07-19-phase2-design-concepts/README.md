# Phase 2: Design Concepts

This change adds support for design concepts as first-class traceability nodes, enabling users to document architecture and design decisions that address requirements.

## Status

- **Proposal**: ✅ Complete
- **Design**: ✅ Complete
- **Specs**: ✅ Complete
- **Tasks**: ✅ Complete
- **Implementation**: Not Started

## Quick Summary

**What**: Add design concept node type with support for:
- Block syntax: `[design, id=DES-001]`
- Section syntax: `[#DES-001, role=design]`
- New relationships: addresses, implements, composed-of, depends-on
- New matrices: requirements-design, design-implementations
- New coverage metrics: design coverage, requirement coverage by design

**Why**: Enable users to trace architecture and design decisions to requirements, providing a complete picture of the system's design and implementation.

**When**: After Phase 1 (ESM/CJS compatibility) is complete

## Key Features

### 1. Design Node Creation
- Create design concepts using blocks or sections
- Blocks: `[design, id=DES-001]` - for structured specifications
- Sections: `[#DES-001, role=design]` - for natural documentation

### 2. New Relationships
- `addresses:REQ-001[]` - Design addresses requirement
- `implements:DES-001[]` - Implementation implements design
- `composed-of:DES-002[]` - Design composed of other designs
- `depends-on:DES-003[]` - Design depends on other designs

### 3. New Matrices
- `matrix-req-design.csv/html` - Which designs address which requirements
- `matrix-design-impl.csv/html` - Which implementations implement which designs

### 4. New Coverage Metrics
- Design Coverage: % of designs with implementations
- Requirement Coverage by Design: % of requirements addressed by designs

## Implementation Phases

### Phase 2A: Core Support (9.5 hours)
- Type definitions
- Parser updates (blocks and sections)
- Relationship parsing
- Graph updates
- Matrix generation

### Phase 2B: Integration (5 hours)
- Validation
- Example site update
- Unit tests
- Manual testing

### Phase 2C: Documentation (1.5 hours)
- User guide updates
- Developer guide updates

## Related Changes

- `requirements-traceability` (archived) - Original implementation
- `typescript-refactoring` (archived) - TypeScript conversion
- `example-site` - Example Antora site (Phase 1)

## Files to Modify

- `src/types.ts` - Add Design type and new relationship types
- `src/DocumentParser.ts` - Add design block and section parsing
- `src/TraceabilityGraph.ts` - Add design node and relationship methods
- `src/MatrixGenerator.ts` - Add new matrices
- `src/antora-extension.ts` - Update coverage report
- `example-site/docs/modules/ROOT/pages/architecture.adoc` - Use design sections
- `test/*` - Add tests for new functionality
- `docs/user-guide.adoc` - Document design concepts
- `docs/developer-guide.adoc` - Document new APIs
