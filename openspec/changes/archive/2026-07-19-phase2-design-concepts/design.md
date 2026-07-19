# Design: Add Design Concept Support

## Overview

This design document describes the architecture for adding design concept support to the Requirements Traceability Extension. Design concepts enable users to document architecture and design decisions that address requirements, with full traceability to implementations.

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Traceability System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Parser      │    │  Graph       │    │  Generator   │   │
│  │              │───▶│              │───▶│              │   │
│  │ - Block      │    │ - Nodes      │    │ - Matrices   │   │
│  │ - Section    │    │ - Relationships│   │ - Reports    │   │
│  │ - Inline     │    │ - Queries    │    │              │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│           │                  │                    │            │
│           ▼                  ▼                    ▼            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Node Types                            │ │
│  │                                                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │ Requirement │ │ Implementation│ │ Design      │      │ │
│  │  │             │ │             │ │ Concept     │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  │                                                          │ │
│  │  ┌─────────────┐ ┌─────────────┐                          │ │
│  │  │ Test        │ │ Document    │                          │ │
│  │  │             │ │             │                          │ │
│  │  └─────────────┘ └─────────────┘                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Node Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Node Creation Pipeline                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input: AsciiDoc Content                                    │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────┐                                   │
│  │ Parse Blocks         │                                   │
│  │ - [req, id=X]       │                                   │
│  │ - [imp, id=X]       │                                   │
│  │ - [test, id=X]      │                                   │
│  │ - [doc, id=X]       │                                   │
│  │ - [design, id=X]    │ ← NEW                              │
│  └────────┬────────────┘                                   │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────┐                                   │
│  │ Parse Sections      │ ← NEW                              │
│  │ - [#X, role=Y]     │                                   │
│  │ - Extract content   │                                   │
│  └────────┬────────────┘                                   │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────┐                                   │
│  │ Validate Nodes      │                                   │
│  │ - Unique IDs        │                                   │
│  │ - Valid roles       │                                   │
│  │ - Role/type match   │                                   │
│  └────────┬────────────┘                                   │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────┐                                   │
│  │ Parse Relationships │                                   │
│  │ - Inline macros     │                                   │
│  │ - Attributes        │ ← NEW (addresses=X,Y)              │
│  └────────┬────────────┘                                   │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────┐                                   │
│  │ Build Graph         │                                   │
│  │ - Add nodes         │                                   │
│  │ - Add relationships │                                   │
│  └─────────────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Node Types

### Existing Node Types (Unchanged)

| Type | Block Syntax | Section Syntax | Role | Description |
|------|--------------|----------------|------|-------------|
| Requirement | `[req, id=X]` | `[#X, role=requirement]` | requirement | A requirement that must be satisfied |
| Implementation | `[imp, id=X]` | `[#X, role=implementation]` | implementation | An implementation of a requirement or design |
| Test | `[test, id=X]` | `[#X, role=test]` | test | A test that verifies a requirement or implementation |
| Document | `[doc, id=X]` | `[#X, role=document]` | document | Documentation that describes a requirement |

### New Node Type

| Type | Block Syntax | Section Syntax | Role | Description |
|------|--------------|----------------|------|-------------|
| Design | `[design, id=X]` | `[#X, role=design]` | design | A design concept that addresses requirements |

**Role Inference Rules:**
- Blocks: Role is inferred from block type (`[req]` → `requirement`, `[design]` → `design`)
- Sections: Role is **required** (no inference)
- Error: If explicit role conflicts with inferred role (e.g., `[req, id=X, role=design]`)

## Relationship Types

### Existing Relationships (Unchanged)

| Relationship | Macro | Attribute | Direction | Description |
|-------------|-------|-----------|-----------|-------------|
| satisfies | `satisfies:REQ-001[]` | - | impl → req | Implementation satisfies requirement |
| tests | `tests:IMP-001[]` | - | test → impl | Test tests implementation |
| verifies | `verifies:REQ-001[]` | - | test → req | Test verifies requirement |
| documents | `documents:REQ-001[]` | - | doc → req | Document documents requirement |
| depends | `depends:REQ-001[]` | - | any → any | Generic dependency |
| requires | `requires:REQ-001[]` | - | any → any | Generic requirement |

### New Relationships (Phase 2)

| Relationship | Macro | Attribute | Direction | Description |
|-------------|-------|-----------|-----------|-------------|
| addresses | `addresses:REQ-001[]` | `addresses=REQ-001,REQ-002` | design → req | Design addresses requirement(s) |
| implements | `implements:DES-001[]` | - | impl → design | Implementation implements design |
| composed-of | `composed-of:DES-002[]` | `composed-of=DES-002,DES-003` | design → design | Design is composed of other designs |
| depends-on | `depends-on:DES-003[]` | `depends-on=DES-003,DES-004` | design → design | Design depends on other designs |

**Note:** In Phase 2, we only implement the **primary direction** of relationships. Inverse relationships (addressed-by, implemented-by, part-of, depended-by) will be added in Phase 3.

## Syntax Examples

### Block-Based Syntax (Recommended for Specifications)

```asciidoc
[design, id=DES-001, title="Authentication System"]
====
The authentication system provides user login and session management.

This design addresses the following requirements:
addresses:REQ-001,REQ-002,REQ-003[]

It is composed of:
composed-of:DES-002,DES-003[]

It depends on:
depends-on:DES-004[]
====

[design, id=DES-002, title="Password Authentication"]
====
Password-based authentication using bcrypt.
====

[imp, id=IMP-001]
====
Login service implementation.
implements:DES-001[]
====
```

### Section-Based Syntax (Recommended for Documentation)

```asciidoc
[#DES-001, role=design, title="Authentication System"]
== Authentication System

The authentication system provides user login and session management.

This design addresses the following requirements:
addresses:REQ-001,REQ-002,REQ-003[]

It is composed of:
composed-of:DES-002,DES-003[]

It depends on:
depends-on:DES-004[]

[#DES-002, role=design, title="Password Authentication"]
=== Password Authentication

Password-based authentication using bcrypt.

[#IMP-001, role=implementation]
=== Login Service

Login service implementation.
implements:DES-001[]
```

### Mixed Syntax (Allowed)

```asciidoc
[#DES-001, role=design]
== Authentication System

addresses:REQ-001[]

[design, id=DES-002]
====
Password Authentication
====

[imp, id=IMP-001]
====
Login Service
implements:DES-001[]
====
```

## Parser Changes

### DocumentParser Updates

1. **Add design block parsing**
   - Recognize `[design, id=X]` blocks
   - Extract ID, title, content, attributes
   - Infer role as `design`

2. **Add section parsing**
   - Find all headings with `[#ID, ...]` attributes
   - Extract ID, role, other attributes
   - Extract content from heading to next same-level heading
   - Require explicit `role` attribute for sections

3. **Update relationship parsing**
   - Parse `addresses` inline macros (design → requirement)
   - Parse `implements` inline macros (implementation → design)
   - Parse `composed-of` inline macros (design → design)
   - Parse `depends-on` inline macros (design → design)
   - Parse `addresses` attributes on sections (comma-separated)
   - Parse `composed-of` attributes on sections (comma-separated)
   - Parse `depends-on` attributes on sections (comma-separated)

4. **Validation**
   - All node IDs must be unique
   - Section nodes must have explicit role
   - Explicit role must match inferred role for blocks
   - Referenced IDs must exist (warning, not error in Phase 2)

### TraceabilityGraph Updates

1. **Add design node type**
   - Store design nodes alongside other node types
   - Support design-specific queries

2. **Add new relationship types**
   - addresses (design → requirement)
   - implements (implementation → design)
   - composed-of (design → design)
   - depends-on (design → design)

3. **Update query methods**
   - `getDesignsForRequirement(reqId)` - Find all designs that address a requirement
   - `getRequirementsForDesign(designId)` - Find all requirements addressed by a design
   - `getImplementationsForDesign(designId)` - Find all implementations that implement a design
   - `getDesignsForImplementation(implId)` - Find all designs implemented by an implementation
   - `getComposedOf(designId)` - Find designs that this design is composed of
   - `getDependencies(designId)` - Find designs that this design depends on

## Matrix Generation Changes

### New Matrices

1. **requirements-design.csv**
   - Rows: All requirements
   - Columns: All design concepts
   - Cell: ✓ if design addresses requirement (direct relationship)
   - Summary: Count and percentage of requirements addressed by designs

2. **design-implementations.csv**
   - Rows: All design concepts
   - Columns: All implementations
   - Cell: ✓ if implementation implements design (direct relationship)
   - Summary: Count and percentage of designs implemented

### Matrix Format

Both matrices use the existing HTML and CSV generation infrastructure. The format matches existing matrices:

```csv
Requirement ID,Requirement Title,DES-001,DES-002,DES-003,Status
REQ-001,User Login,✓,,,✓ Complete
REQ-002,Password Auth,✓,✓,,✓ Complete
REQ-003,OAuth,✓,,,✓ Complete

Total Requirements: 3
Requirements with Designs: 3
Design Coverage: 100%
```

## Coverage Report Updates

Add two new metrics to the coverage report:

1. **Design Coverage**
   - Total designs: N
   - Designs with implementations: M
   - Coverage: (M/N) × 100%

2. **Requirement Coverage by Design**
   - Total requirements: N
   - Requirements addressed by designs: M
   - Coverage: (M/N) × 100%

Updated coverage report structure:

```
┌─────────────────────────────────────────┐
│           Coverage Report               │
├─────────────────────────────────────────┤
│                                             │
│  Implementation Coverage: 75%            │
│  ┌─────────────────────────────────┐   │
│  │ ████████████░░░░░░░░ 75%        │   │
│  └─────────────────────────────────┘   │
│                                             │
│  Test Coverage: 50%                      │
│  ┌─────────────────────────────────┐   │
│  │ ████████░░░░░░░░░░ 50%          │   │
│  └─────────────────────────────────┘   │
│                                             │
│  Design Coverage: 66%                   │
│  ┌─────────────────────────────────┐   │
│  │ ██████████░░░░░░░░ 66%          │   │
│  └─────────────────────────────────┘   │
│                                             │
│  Requirement Coverage by Design: 80%   │
│  ┌─────────────────────────────────┐   │
│  │ ████████████████░░░░ 80%          │   │
│  └─────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────┘
```

## File Structure Changes

### Source Files

```
src/
├── types.ts                    # Add Design type, DesignRelationshipType
├── DocumentParser.ts           # Add design block parsing, section parsing
├── TraceabilityGraph.ts        # Add design node methods, new relationship types
├── MatrixGenerator.ts          # Add requirements-design, design-implementations
├── antora-extension.ts         # Minimal changes (already handles generic nodes)
└── index.ts                    # Export new types
```

### Test Files

```
test/
├── document-parser.test.ts      # Add design parsing tests
├── graph.test.ts               # Add design node tests, new relationship tests
└── matrix-generator.test.ts    # Add new matrix tests
```

## Backward Compatibility

All changes are **additive**:
- New node type (design) doesn't affect existing nodes
- New relationship types don't affect existing relationships
- New matrices don't affect existing matrices
- Existing functionality remains unchanged

**Validation:**
- Run all existing tests - should pass
- Run new tests for design concepts - should pass
- Manual testing of example site - should work

## Error Handling

1. **Duplicate IDs**
   - Error message: "Duplicate node ID: {id}. IDs must be unique across all node types."
   - Severity: Error (build fails)

2. **Missing Role on Section**
   - Error message: "Section with ID {id} has no role attribute. Sections must have explicit role to be traceability nodes."
   - Severity: Warning (node ignored, build continues)

3. **Role/Type Mismatch**
   - Error message: "Node {id} has role '{role}' but block type implies role '{inferred}'. Role must match block type."
   - Severity: Error (build fails)

4. **Invalid Role**
   - Error message: "Invalid role: {role}. Valid roles are: requirement, implementation, test, document, design."
   - Severity: Error (build fails)

5. **Referenced Node Not Found**
   - Error message: "Referenced node {id} not found. All referenced nodes must be defined."
   - Severity: Warning (relationship ignored, build continues)
   - Note: May change to Error in future phase

## Migration Path

Users with existing content:
- No changes required - existing content works as-is
- To use design concepts, add `[design, id=X]` blocks or `[#X, role=design]` sections
- Update inline macros to use new relationship types where appropriate

Users starting fresh:
- Can use blocks, sections, or both
- Recommended: Use blocks for specifications, sections for documentation

## Configuration

No configuration changes required. The extension automatically detects and processes design concepts.

## Future Enhancements (Phase 3+)

1. **Bidirectional Relationships**
   - Add inverse macros: addressed-by, implemented-by, part-of, depended-by
   - Enable querying from both directions

2. **Transitive Coverage**
   - Calculate coverage through relationship chains
   - Example: If DES-001 addresses REQ-001 and IMP-001 implements DES-001, then IMP-001 transitively satisfies REQ-001

3. **Visual Hierarchy**
   - Show parent-child relationships in matrices
   - Indent child nodes under parent nodes

4. **Design-Design Matrix**
   - Show relationships between design concepts
   - Useful for understanding architecture

5. **Filtering and Search**
   - Filter matrices by status, type, etc.
   - Search for specific nodes or relationships
