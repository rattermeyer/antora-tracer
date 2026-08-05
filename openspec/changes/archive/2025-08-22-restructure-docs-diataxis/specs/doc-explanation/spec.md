## ADDED Requirements

### Requirement: Explanation pages for concepts, architecture, and design rationale
The example site SHALL include Explanation pages covering:
- The traceability model (roles, relations, matrices as concepts)
- The processing pipeline (how passes work, the graph lifecycle)
- The arc42 architecture document
- Architecture Decision Records (ADRs)
- Quality attributes
- Comparison with Sphinx Needs (feature mapping)
- Antora vs Sphinx publishing pipeline comparison

#### Scenario: Traceability model is a conceptual explanation
- **WHEN** a reader views the traceability model explanation
- **THEN** it SHALL explain the concepts of roles, relations, and matrices
- **AND** it SHALL NOT include step-by-step instructions or exhaustive option listings

#### Scenario: Architecture document remains intact
- **WHEN** the explanation section is structured
- **THEN** `architecture.adoc` SHALL remain as a single page under Explanation
- **AND** all ARC traceable items SHALL remain in their current source file

#### Scenario: ADR index links to individual ADRs
- **WHEN** a reader views the ADR index under Explanation
- **THEN** it SHALL list and link to all architecture decision records

### Requirement: Explanation pages link to Reference and How-to
Explanation pages SHALL include links to relevant Reference pages and How-to guides for readers who want to act on the understanding gained.

#### Scenario: Processing pipeline explanation links to API reference
- **WHEN** a reader views the processing pipeline explanation
- **THEN** it SHALL link to the API reference for the described components

### Requirement: Explanation section in navigation
The example site navigation SHALL include an "Explanation" section containing all explanation pages.

#### Scenario: Navigation shows Explanation section
- **WHEN** the example site is built with Antora
- **THEN** the navigation SHALL display "Explanation" as a top-level section
