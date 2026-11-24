## MODIFIED Requirements

### Requirement: Self-Traceability nav section groups demo pages
The example site navigation SHALL include a "Self-Traceability" section containing the pages that demonstrate the extension tracing its own development artifacts:
- Our Traceability Model
- Requirements
- Use Cases
- Test Plan
- Delivery Process
- Dashboard

#### Scenario: Navigation shows Self-Traceability section
- **WHEN** the example site is built with Antora
- **THEN** the navigation SHALL display "Self-Traceability" as a top-level section
- **AND** it SHALL contain Our Traceability Model, Requirements, Use Cases, Test Plan, Delivery Process, and Dashboard as child items
- **AND** the section SHALL appear after the four user-facing documentation sections

#### Scenario: The project's own model is not under Explanation
- **WHEN** a reader views the Explanation section navigation
- **THEN** it SHALL NOT list the project's own traceability model
- **AND** the domain-neutral concept page SHALL remain under Explanation