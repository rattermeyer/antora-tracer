## ADDED Requirements

### Requirement: Architecture document includes class-level API diagram
The architecture document SHALL include a class-level diagram showing the public interface of each major component.

#### Scenario: Developer reads Building Block View
- **WHEN** a developer opens the architecture page
- **THEN** the Building Block View section SHALL contain both the component dependency diagram and the class/API diagram
- **AND** the class diagram SHALL show each component's public methods with return types

#### Scenario: Interface changes are reflected
- **WHEN** a public method signature changes on a core component
- **THEN** the `update-example-site` skill SHALL flag the class diagram for review

### Requirement: Architecture document includes DocumentParser activity diagram
The architecture document SHALL include an activity diagram showing the parser's step-by-step pipeline: verbatim block pre-scanning, item block extraction with quote-aware bracket matching, body delimiter detection, relationship macro scanning with inline-code exclusion, old-macro detection, and result assembly.

#### Scenario: Developer reads DocumentParser section
- **WHEN** a developer reads the DocumentParser component description (ARC-017)
- **THEN** the activity diagram SHALL be visible inline with the prose description
- **AND** the diagram SHALL show the sequential order of parsing operations

### Requirement: Architecture document includes TraceabilityGraph state diagram
The architecture document SHALL include a state diagram showing the graph lifecycle: empty → populated (items added) → complete (relationships added, ready for queries), including which operations are valid in each state.

#### Scenario: Developer reads TraceabilityGraph section
- **WHEN** a developer reads the TraceabilityGraph component description (ARC-015)
- **THEN** the state diagram SHALL be visible inline with the prose description
- **AND** the diagram SHALL make the pass-ordering constraint (Complete before Pass 3 queries) visually explicit

### Requirement: Architecture document includes PreparedFile caching flow diagram
The architecture document SHALL include an activity diagram showing the file-state caching flow: file content, document attributes, and block positions computed once per file, then reused across all macro-expansion passes.

#### Scenario: Developer reads the macro expansion section
- **WHEN** a developer reads about the contentClassified processing flow (ARC-003 or ARC-016)
- **THEN** the caching flow diagram SHALL be visible
- **AND** the diagram SHALL show that five expand methods receive the same PreparedFile

### Requirement: update-example-site skill includes diagram checklist
The `update-example-site` skill SHALL include a diagram checklist per arc42 section, guidance on when to add each diagram type (class, sequence, activity, state), and conventions for diagram file placement in the `examples/` directory.

#### Scenario: Skill is invoked after archiving a change
- **WHEN** the `update-example-site` skill runs the architecture update step
- **THEN** the skill SHALL reference the diagram checklist to determine which diagrams need review
- **AND** the skill SHALL provide decision guidance for when new diagram types are warranted

#### Scenario: New component or algorithm is added
- **WHEN** a change introduces a new component with complex internal logic
- **THEN** the skill SHALL suggest adding an activity diagram if the logic spans more than a paragraph of prose
- **AND** the skill SHALL suggest updating the class diagram if the component exposes a public API
