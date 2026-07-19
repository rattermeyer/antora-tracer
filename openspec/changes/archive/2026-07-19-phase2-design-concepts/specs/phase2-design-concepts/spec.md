# Phase 2: Design Concepts Specification

## Capability: phase2-design-concepts

### Requirement: Design Node Creation via Blocks

**ID**: PH2-REQ-001
**Title**: Support design node creation using block syntax
**Status**: Approved
**Priority**: High

The system shall allow users to create design concept nodes using the `[design]` block macro syntax.

**Acceptance Criteria**:
- Users can define design concepts with `[design, id=DES-001]`
- Design concepts can have optional title attribute: `[design, id=DES-001, title="My Design"]`
- Design concepts can have optional status attribute
- Design concepts can contain multi-line content delimited by `====`
- Design nodes are stored in the traceability graph with role `design`
- Design nodes can be queried using graph methods

**Examples**:
```asciidoc
[design, id=DES-001, title="Authentication System"]
====
This design concept addresses user authentication.
====
```

---

### Requirement: Design Node Creation via Sections

**ID**: PH2-REQ-002
**Title**: Support design node creation using section syntax
**Status**: Approved
**Priority**: High

The system shall allow users to create design concept nodes using AsciiDoc section headings with role attributes.

**Acceptance Criteria**:
- Users can define design concepts with `[#DES-001, role=design]`
- Design sections can have optional title attribute
- Design sections can have optional other attributes
- Content is extracted from the section heading to the next same-level heading
- Section nodes are stored in the traceability graph with role `design`
- Section nodes can be queried using graph methods

**Examples**:
```asciidoc
[#DES-001, role=design, title="Authentication System"]
== Authentication System

This design concept addresses user authentication.

=== Subsection

Subsection content is included in the design concept.
```

---

### Requirement: Addresses Relationship (Design to Requirement)

**ID**: PH2-REQ-003
**Title**: Support addresses relationship from design to requirement
**Status**: Approved
**Priority**: High

The system shall allow design concepts to specify which requirements they address.

**Acceptance Criteria**:
- Design concepts can use inline macro syntax: `addresses:REQ-001[]`
- Design concepts can use attribute syntax: `addresses=REQ-001,REQ-002`
- Both single and comma-separated requirement IDs are supported
- Relationships are stored in the graph as `addresses` type
- Multiple addresses relationships can be specified
- Relationships can be queried from design or requirement side

**Examples**:
```asciidoc
[design, id=DES-001]
====
This design addresses:
addresses:REQ-001[]
====

[#DES-001, role=design, addresses=REQ-001,REQ-002]
== Design

This design addresses REQ-001 and REQ-002.
```

---

### Requirement: Implements Relationship (Implementation to Design)

**ID**: PH2-REQ-004
**Title**: Support implements relationship from implementation to design
**Status**: Approved
**Priority**: High

The system shall allow implementations to specify which design concepts they implement.

**Acceptance Criteria**:
- Implementations can use inline macro syntax: `implements:DES-001[]`
- Relationships are stored in the graph as `implements` type
- Multiple implements relationships can be specified
- Relationships can be queried from implementation or design side

**Examples**:
```asciidoc
[imp, id=IMP-001]
====
Login service implementation.
implements:DES-001[]
====
```

---

### Requirement: Design-Design Composition Relationship

**ID**: PH2-REQ-005
**Title**: Support composed-of relationship between design concepts
**Status**: Approved
**Priority**: Medium

The system shall allow design concepts to specify which other design concepts they are composed of.

**Acceptance Criteria**:
- Design concepts can use inline macro syntax: `composed-of:DES-002[]`
- Design concepts can use attribute syntax: `composed-of=DES-002,DES-003`
- Both single and comma-separated design IDs are supported
- Relationships are stored in the graph as `composed-of` type
- Relationships can be queried from parent or child side

**Examples**:
```asciidoc
[design, id=DES-001]
====
Authentication system composed of:
composed-of:DES-002,DES-003[]
====
```

---

### Requirement: Design-Design Dependency Relationship

**ID**: PH2-REQ-006
**Title**: Support depends-on relationship between design concepts
**Status**: Approved
**Priority**: Medium

The system shall allow design concepts to specify which other design concepts they depend on.

**Acceptance Criteria**:
- Design concepts can use inline macro syntax: `depends-on:DES-004[]`
- Design concepts can use attribute syntax: `depends-on=DES-004,DES-005`
- Both single and comma-separated design IDs are supported
- Relationships are stored in the graph as `depends-on` type
- Relationships can be queried from dependent or dependency side

**Examples**:
```asciidoc
[design, id=DES-001]
====
Authentication system depends on:
depends-on:DES-004[]
====
```

---

### Requirement: Requirements-Design Matrix Generation

**ID**: PH2-REQ-007
**Title**: Generate matrix showing which designs address which requirements
**Status**: Approved
**Priority**: High

The system shall generate a matrix showing the relationships between requirements and design concepts.

**Acceptance Criteria**:
- Matrix is generated in CSV format
- Matrix is generated in HTML format
- Rows represent requirements
- Columns represent design concepts
- Cell contains ✓ if design addresses requirement
- Cell contains ✗ or empty if no relationship
- Matrix includes summary statistics (total, covered, percentage)
- Matrix is written to `traceability/requirements-design.csv` and `.html`

**Examples**:
```csv
Requirement ID,Requirement Title,DES-001,DES-002,Status
REQ-001,User Login,✓,✓,✓ Complete
REQ-002,Password Auth,✓,,⚠ Partial
REQ-003,OAuth,,✓,✓ Complete

Total Requirements: 3
Requirements with Designs: 3
Design Coverage: 100%
```

---

### Requirement: Design-Implementations Matrix Generation

**ID**: PH2-REQ-008
**Title**: Generate matrix showing which implementations implement which designs
**Status**: Approved
**Priority**: High

The system shall generate a matrix showing the relationships between design concepts and implementations.

**Acceptance Criteria**:
- Matrix is generated in CSV format
- Matrix is generated in HTML format
- Rows represent design concepts
- Columns represent implementations
- Cell contains ✓ if implementation implements design
- Cell contains ✗ or empty if no relationship
- Matrix includes summary statistics (total, implemented, percentage)
- Matrix is written to `traceability/design-implementations.csv` and `.html`

**Examples**:
```csv
Design ID,Design Title,IMP-001,IMP-002,Status
DES-001,Auth System,✓,,⚠ Partial
DES-002,Password,✓,✓,✓ Complete
DES-003,OAuth,,✓,✓ Complete

Total Designs: 3
Designs with Implementations: 3
Implementation Coverage: 100%
```

---

### Requirement: Design Coverage Metric

**ID**: PH2-REQ-009
**Title**: Track and report design coverage
**Status**: Approved
**Priority**: Medium

The system shall calculate and report the percentage of design concepts that have at least one implementation.

**Acceptance Criteria**:
- Coverage is calculated as: (designs with ≥1 implementation / total designs) × 100
- Coverage is displayed in the coverage report
- Coverage is displayed as a percentage with visual progress bar
- Coverage metric is labeled as "Design Coverage"

---

### Requirement: Requirement Coverage by Design Metric

**ID**: PH2-REQ-010
**Title**: Track and report requirement coverage by design
**Status**: Approved
**Priority**: Medium

The system shall calculate and report the percentage of requirements that are addressed by at least one design concept.

**Acceptance Criteria**:
- Coverage is calculated as: (requirements with ≥1 design / total requirements) × 100
- Coverage is displayed in the coverage report
- Coverage is displayed as a percentage with visual progress bar
- Coverage metric is labeled as "Requirement Coverage by Design"

---

### Requirement: Role Validation

**ID**: PH2-REQ-011
**Title**: Validate node roles
**Status**: Approved
**Priority**: High

The system shall validate that node roles are consistent with their definition method.

**Acceptance Criteria**:
- Block nodes have role inferred from block type (`[req]` → `requirement`)
- Section nodes must have explicit `role` attribute
- Error if explicit role conflicts with inferred role
- Error if explicit role is invalid (not in allowed list)
- Allowed roles: requirement, implementation, test, document, design

---

### Requirement: Unique ID Validation

**ID**: PH2-REQ-012
**Title**: Validate node ID uniqueness
**Status**: Approved
**Priority**: High

The system shall ensure all node IDs are unique across all node types.

**Acceptance Criteria**:
- Error if duplicate ID is found in same file
- Error if duplicate ID is found across different files
- Error message includes the duplicate ID and locations
- Build fails if duplicate IDs exist

---

### Requirement: Section Content Extraction

**ID**: PH2-REQ-013
**Title**: Extract content from sections
**Status**: Approved
**Priority**: High

The system shall correctly extract content from section headings for traceability nodes.

**Acceptance Criteria**:
- Content starts at the section heading
- Content includes all text until the next heading at the same level
- Content includes all subsections (lower level headings)
- Content excludes the next same-level heading and its content
- Content is stored as a string for the node

**Examples**:
```asciidoc
[#DES-001, role=design]
== Design One

Content for design one.

=== Subsection

More content.

== Design Two

Content for design two.

# For DES-001, content is:
# "Content for design one.\n\n=== Subsection\n\nMore content."
```

---

### Requirement: Attribute Parsing

**ID**: PH2-REQ-014
**Title**: Parse attributes on sections
**Status**: Approved
**Priority**: High

The system shall parse and process attributes specified on section headings.

**Acceptance Criteria**:
- Parse `role` attribute (required for sections)
- Parse `addresses` attribute (comma-separated requirement IDs)
- Parse `composed-of` attribute (comma-separated design IDs)
- Parse `depends-on` attribute (comma-separated design IDs)
- Parse any other attributes for future extensibility
- Attributes are case-insensitive
- Comma-separated values are trimmed of whitespace

---

### Requirement: Backward Compatibility

**ID**: PH2-REQ-015
**Title**: Maintain backward compatibility
**Status**: Approved
**Priority**: Critical

All existing functionality shall continue to work without modification.

**Acceptance Criteria**:
- All existing node types continue to work
- All existing relationship types continue to work
- All existing matrices continue to be generated
- All existing tests continue to pass
- No breaking changes to the API

---

### Requirement: Error Handling

**ID**: PH2-REQ-016
**Title**: Provide clear error messages
**Status**: Approved
**Priority**: Medium

The system shall provide clear, actionable error messages for common issues.

**Acceptance Criteria**:
- Duplicate ID errors include the ID and both locations
- Missing role errors include the section ID
- Role mismatch errors include the ID, explicit role, and inferred role
- Invalid role errors include the ID and the invalid role
- Referenced node not found warnings include the referenced ID

---

### Requirement: Example Site Update

**ID**: PH2-REQ-017
**Title**: Update example site to demonstrate design concepts
**Status**: Approved
**Priority**: Medium

The example site shall be updated to demonstrate the new design concept functionality.

**Acceptance Criteria**:
- architecture.adoc uses design sections with role=design
- Design concepts address example requirements
- Design concepts are implemented by example implementations
- Generated matrices show design relationships
- Coverage report shows design coverage metrics
