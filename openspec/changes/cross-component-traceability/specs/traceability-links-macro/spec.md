## MODIFIED Requirements

### Requirement: Graph isolation per version
Relationship macro expansion SHALL produce xrefs only to items in the same version as the enclosing page, spanning components at that version.

#### Scenario: Cross-version xref is not generated
- **WHEN** a site is built with two component versions (`v0.10.x` and `v0.11.x`)
- **AND** `v0.10.x` contains a page with `leads_to:UC-001[]`
- **AND** `UC-001` is defined in `v0.11.x`'s `use-cases.adoc` but not in `v0.10.x`
- **THEN** no `xref:use-cases.adoc#UC-001` SHALL be generated in `v0.10.x` output

#### Scenario: Cross-component xref resolves within a version
- **WHEN** two components are published at the same version
- **AND** an item in component A references an item in component B
- **THEN** relationship macro expansion SHALL render an xref with the `component:module:` prefix

#### Scenario: Same-version xrefs work normally
- **WHEN** a single component version is built
- **THEN** xrefs SHALL resolve to pages within that version as before
