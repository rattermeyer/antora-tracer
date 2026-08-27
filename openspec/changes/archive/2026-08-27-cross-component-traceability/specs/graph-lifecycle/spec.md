## ADDED Requirements

### Requirement: Working graph spans components within a version
The `contentClassified` working graph SHALL include items from every component at the same version, so relationship macros resolve cross-component xrefs. Cross-version isolation is unchanged.

#### Scenario: Cross-component relationship list resolves
- **WHEN** a site has two components at the same version And an item in component A references an item in component B
- **THEN** `traceability:outgoing[]` and `traceability:incoming[]` SHALL render an xref with the `component:module:` prefix

#### Scenario: Cross-version isolation is unchanged
- **WHEN** a site has one component published at two different versions
- **THEN** relationship xrefs SHALL still be scoped per version, not crossing versions
