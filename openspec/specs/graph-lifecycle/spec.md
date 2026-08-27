# graph-lifecycle

## Purpose

The extension keeps a per-version working graph for xref isolation and an accumulated full graph for the `sitePublished` generation passes.

## Requirements

### Requirement: Generation passes use the complete graph across all components and versions
When the extension generates matrices, coverage, and the supersession overview at `sitePublished`, it SHALL use a graph containing every item from every component and version of the site.

#### Scenario: Multi-component generation includes all items
- **WHEN** a site has two components, one with `[item]` blocks and one without
- **THEN** generated matrices and the overview SHALL include the items from the first component

#### Scenario: Per-version xref isolation is preserved
- **WHEN** a site has multiple component versions
- **THEN** xrefs generated during `contentClassified` SHALL still be scoped per version, not crossing versions

### Requirement: Working graph spans components within a version
The `contentClassified` working graph SHALL include items from every component at the same version, so relationship macros resolve cross-component xrefs. Cross-version isolation is unchanged.

#### Scenario: Cross-component relationship list resolves
- **WHEN** a site has two components at the same version And an item in component A references an item in component B
- **THEN** `traceability:outgoing[]` and `traceability:incoming[]` SHALL render an xref with the `component:module:` prefix

#### Scenario: Cross-version isolation is unchanged
- **WHEN** a site has one component published at two different versions
- **THEN** relationship xrefs SHALL still be scoped per version, not crossing versions
