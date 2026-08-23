## ADDED Requirements

### Requirement: Generation passes use the complete graph across all components and versions
When the extension generates matrices, coverage, and the supersession overview at `sitePublished`, it SHALL use a graph containing every item from every component and version of the site.

#### Scenario: Multi-component generation includes all items
- **WHEN** a site has two components, one with `[item]` blocks and one without
- **THEN** generated matrices and the overview SHALL include the items from the first component

#### Scenario: Per-version xref isolation is preserved
- **WHEN** a site has multiple component versions
- **THEN** xrefs generated during `contentClassified` SHALL still be scoped per version, not crossing versions
