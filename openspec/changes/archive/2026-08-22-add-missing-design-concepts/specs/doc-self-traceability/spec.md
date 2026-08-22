## ADDED Requirements

### Requirement: Design concepts address functional requirements
Every functional requirement (REQ) in the self-traceability example SHALL be addressed by at least one design concept (ARC item) via an `addresses:REQ-NNN[]` link.

#### Scenario: Each functional requirement has a design concept
- **WHEN** the self-traceability requirements index and architecture document are reconciled
- **THEN** every `role=requirement` item SHALL be referenced by at least one `addresses:REQ-NNN[]` link in `architecture.adoc`
