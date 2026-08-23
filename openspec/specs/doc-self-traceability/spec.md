## Purpose

The example site includes a Self-Traceability section that demonstrates the Antora Tracer extension applied to its own development artifacts. These pages are demonstration content, not user-facing documentation.

## Requirements

### Requirement: Self-Traceability nav section groups demo pages
The example site navigation SHALL include a "Self-Traceability" section containing the pages that demonstrate the extension tracing its own development artifacts:
- Requirements
- Use Cases
- Test Plan
- Dashboard

#### Scenario: Navigation shows Self-Traceability section
- **WHEN** the example site is built with Antora
- **THEN** the navigation SHALL display "Self-Traceability" as a top-level section
- **AND** it SHALL contain Requirements, Use Cases, Test Plan, and Dashboard as child items
- **AND** the section SHALL appear after the four user-facing documentation sections

### Requirement: Self-Traceability section preserves traceable items
The restructuring SHALL keep every traceable `[item]` block in its current AsciiDoc file.

#### Scenario: Traceability graph is unchanged after restructuring
- **WHEN** the example site is rebuilt after restructuring
- **THEN** the `run-example.js` script SHALL produce the same item and relationship counts
- **AND** no validation errors SHALL be introduced

### Requirement: Self-Traceability section is visually distinct
The Self-Traceability section SHALL be clearly separated from the user-facing documentation sections, signaling to readers that these are demonstration artifacts, not documentation about using the tool.

#### Scenario: Section description differentiates from user docs
- **WHEN** a reader views the navigation
- **THEN** the Self-Traceability section SHALL be visually or positionally distinct from Tutorial / How-to / Reference / Explanation

### Requirement: Design concepts address functional requirements
Every functional requirement (REQ) in the self-traceability example SHALL be addressed by at least one design concept (ARC item) via an `addresses:REQ-NNN[]` link.

#### Scenario: Each functional requirement has a design concept
- **WHEN** the self-traceability requirements index and architecture document are reconciled
- **THEN** every `role=requirement` item SHALL be referenced by at least one `addresses:REQ-NNN[]` link in `architecture.adoc`
