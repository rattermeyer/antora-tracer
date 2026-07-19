# Change Proposal: Add Design Concept Support (Phase 2)

## Summary

Add support for design concepts as first-class traceability nodes, enabling users to document architecture and design decisions that address requirements, with full traceability to implementations.

## Problem Statement

Currently, the extension only supports requirements, implementations, tests, and documents as traceability nodes. Users cannot trace architecture components or design decisions to requirements, which limits the ability to:

- Document which design decisions address which requirements
- Show the relationship between design and implementation
- Track coverage of requirements by design concepts
- Generate design-requirement matrices

The architecture.adoc page in the example site uses standalone inline macros like `satisfies:EXAMPLE-002[]` which are not being captured because they're not inside any node block.

## Solution Overview

Introduce design concepts as a new node type that can be defined using either:
- **Block syntax**: `[design, id=DES-001]` for structured specifications
- **Section syntax**: `[#DES-001, role=design]` for natural documentation

Design concepts can:
- Address requirements via `addresses:REQ-001[]` inline macro or `addresses=REQ-001` attribute
- Be implemented by implementations via `implements:DES-001[]` inline macro
- Compose other design concepts via `composed-of:DES-002[]` inline macro
- Depend on other design concepts via `depends-on:DES-003[]` inline macro

New artifacts generated:
- `requirements-design.csv` - Which designs address which requirements
- `design-implementations.csv` - Which implementations implement which designs

## Goals

### Primary Goals
- ✅ Enable users to define design concepts using block or section syntax
- ✅ Support `addresses` relationship between design concepts and requirements
- ✅ Support `implements` relationship between implementations and design concepts
- ✅ Support `composed-of` and `depends-on` relationships between design concepts
- ✅ Generate `requirements-design.csv` matrix
- ✅ Generate `design-implementations.csv` matrix
- ✅ Update coverage report to include design coverage

### Secondary Goals
- ✅ Maintain backward compatibility with existing block-based syntax
- ✅ Provide clear documentation on when to use blocks vs sections
- ✅ Validate that node IDs are unique across all types
- ✅ Validate that role attributes are consistent with block types

### Non-Goals
- ❌ Bidirectional inverse relationships (addressed-by, implemented-by, etc.) - Phase 3
- ❌ Visual hierarchy in matrices (indented children) - Future enhancement
- ❌ Design-design matrix - Can be added later
- ❌ Transitive coverage calculation - Phase 3

## Success Criteria

1. Users can define design concepts using `[design, id=DES-001]` block syntax
2. Users can define design concepts using `[#DES-001, role=design]` section syntax
3. Design concepts can address requirements using inline macros or attributes
4. Implementations can implement design concepts using inline macros
5. Design concepts can compose other design concepts
6. Design concepts can depend on other design concepts
7. `requirements-design.csv` matrix is generated correctly
8. `design-implementations.csv` matrix is generated correctly
9. Coverage report shows design coverage and requirement coverage by design
10. All existing functionality remains intact (backward compatibility)
11. All tests pass (or only expected failures remain)

## Stakeholders

- **Users**: Documentation writers, architects, developers who want to trace design decisions
- **Maintainers**: Extension developers who need to understand and extend the codebase
- **Testers**: Users who verify the extension works correctly

## Dependencies

- Existing block parsing infrastructure
- Existing relationship parsing infrastructure
- Existing matrix generation infrastructure
- Existing coverage report generation

## Risks

1. **Complexity**: Adding a new node type increases code complexity
2. **Performance**: More nodes and relationships to process
3. **Backward Compatibility**: Changes to parser might affect existing functionality
4. **User Confusion**: Two syntaxes (blocks vs sections) might confuse users

## Mitigation Strategies

1. **Complexity**: Keep changes localized to parser and graph modules
2. **Performance**: Optimize relationship storage and querying
3. **Backward Compatibility**: Add comprehensive tests for existing functionality
4. **User Confusion**: Clear documentation with examples of both syntaxes

## Open Questions

1. Should standalone inline macros (not inside any node) be ignored or attached to nearest section?
   - *Proposed*: Ignore in Phase 2, document that macros must be inside nodes

2. Should we support `addresses` as both inline macro and attribute?
   - *Proposed*: Yes, both `addresses:REQ-001[]` and `addresses=REQ-001`

3. Should design-design relationships (`composed-of`, `depends-on`) be bidirectional or unidirectional?
   - *Proposed*: Unidirectional for Phase 2, bidirectional in Phase 3

## Next Steps

1. Review and approve this proposal
2. Create detailed design document
3. Create specifications
4. Create task breakdown
5. Implement changes
6. Test thoroughly
7. Update documentation
8. Archive change
