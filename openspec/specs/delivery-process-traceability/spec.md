## ADDED Requirements

### Requirement: Process requirements are traceable to product requirements
The example site SHALL include a `delivery-process.adoc` document containing process requirements with the `process_requirement` role. Each process requirement SHALL trace to the product requirements it validates via a `validates` relation and to the architectural decisions it implements via a `deploys` relation.

#### Scenario: Process requirement traces to product requirement
- **WHEN** a process requirement PRQ-002 (test suite as merge gate) is defined
- **THEN** it SHALL include `validates:REQ-087[]` and `validates:REQ-088[]` relations
- **AND** the traceability matrix SHALL show PRQ-002 as covering those requirements

#### Scenario: Process requirement traces to architectural decision
- **WHEN** a process requirement PRQ-001 (CI triggers) is defined
- **THEN** it SHALL include a `deploys:ARC-031[]` relation
- **AND** the design matrix SHALL show the process requirement as implementing that architecture

### Requirement: Process-to-product matrix exists
The example site configuration SHALL define a `process-to-product` matrix with `process_requirement` as rows, `requirement` as columns, and `validates` as the coverage relation.

#### Scenario: Process matrix is generated
- **WHEN** `run-example.js` is executed
- **THEN** a `matrix-process-to-product.html` file SHALL be generated
- **AND** the matrix SHALL show which process requirements cover which product requirements

### Requirement: Process requirements document follows site conventions
The `delivery-process.adoc` SHALL use the same `[item]` macro format, `[#PRQ-XXX, item, role=process_requirement]` IDs, and `traceability:links[]` rendering macros as other example documents.

#### Scenario: Process document renders in the site
- **WHEN** the Antora site is built
- **THEN** the delivery process page SHALL be accessible from the navigation
- **AND** process requirement items SHALL render with clickable relationship lists
