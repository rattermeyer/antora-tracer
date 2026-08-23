## MODIFIED Requirements

### Requirement: Matrix links resolve correctly from site output location
The system SHALL generate matrix links that resolve correctly regardless of where the matrix file is served within the Antora site output.

#### Scenario: Link generation in Antora build context
- **WHEN** matrices are generated during Antora build
- **THEN** links use `../../` prefix to navigate from `_attachments/traceability/` to component root
