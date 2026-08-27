## MODIFIED Requirements

### Requirement: Matrix links resolve correctly from site output location
The system SHALL generate matrix links that resolve correctly regardless of where the matrix file is served within the Antora site output, resolving each item from the site root via its published URL so same-component and cross-component targets both resolve.

#### Scenario: Link generation in Antora build context
- **WHEN** matrices are generated during Antora build
- **AND** the target item carries a `pubUrl` (its published page URL)
- **THEN** the link SHALL resolve from the site root as `siteRootPath + pubUrl` (e.g., `../../../../tracer/stable/index.html#REQ-109` from a `_attachments/traceability/` matrix)

#### Scenario: Cross-component matrix link resolves
- **WHEN** a matrix registered under one component references an item in a sibling component at the same version
- **THEN** the link SHALL escape to the site root and include the target component and version segment
