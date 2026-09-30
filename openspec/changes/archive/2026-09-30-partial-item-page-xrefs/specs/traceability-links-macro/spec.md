## MODIFIED Requirements

### Requirement: Cross-module and cross-component xref resolution
When a relationship target is defined in an Antora partial, the `traceability:outgoing[]` and `traceability:incoming[]` macros SHALL resolve the target to the Antora page that includes that partial.
The generated xref SHALL preserve the target item's component and module qualification and SHALL use the explicit item ID as its fragment.
If no including page is discoverable, the implementation SHALL retain the existing safe fallback rather than linking to the partial source file.

#### Scenario: Relationship target is defined in a partial
- **WHEN** an item in component `demo` has a relationship to `UC-007`
- **AND** `UC-007` is defined in `tracer` module `ROOT` partial `partials/use-cases/validation-and-maintenance.adoc`
- **AND** that partial is included by `self-traceability/use-cases.adoc`
- **THEN** the generated AsciiDoc link SHALL be `xref:tracer:ROOT:self-traceability/use-cases#UC-007[UC-007]`

#### Scenario: Partial xref is converted by Antora
- **WHEN** Antora processes `xref:tracer:ROOT:self-traceability/use-cases#UC-007[UC-007]`
- **THEN** the rendered link SHALL target `/tracer/stable/self-traceability/use-cases.html#UC-007`

#### Scenario: Partial source remains graph provenance
- **WHEN** an item is discovered in a partial
- **THEN** its graph `sourceFile` SHALL remain the partial source
- **AND** its component, module, and version metadata SHALL remain available for link qualification

#### Scenario: Partial include target is unknown
- **WHEN** an item is defined in a partial with no discoverable including page
- **THEN** link generation SHALL NOT emit a link to the partial source file
- **AND** the existing safe fallback SHALL be used
