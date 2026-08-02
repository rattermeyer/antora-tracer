## ADDED Requirements

### Requirement: Graph isolation per component version
When building a site with multiple component versions, relationship macro expansion SHALL be scoped per version. Items from one component version SHALL NOT appear in xrefs generated for pages in a different component version.

#### Scenario: Cross-version xref is not generated
- **WHEN** a site is built with two component versions (`v0.10.x` and `v0.11.x`)
- **AND** `v0.10.x` contains a page with `leads_to:UC-001[]`
- **AND** `UC-001` is defined in `v0.11.x`'s `use-cases.adoc` but not in `v0.10.x`
- **THEN** no `xref:use-cases.adoc#UC-001` SHALL be generated in `v0.10.x` output

#### Scenario: Same-version xrefs work normally
- **WHEN** a single component version is built
- **THEN** xrefs SHALL resolve to pages within that version as before
