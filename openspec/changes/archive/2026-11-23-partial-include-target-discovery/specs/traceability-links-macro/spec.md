## MODIFIED Requirements

### Requirement: Cross-module and cross-component xref resolution
When a relationship target is defined in an Antora partial, the `traceability:outgoing[]` and `traceability:incoming[]` macros SHALL resolve the target to the Antora page that includes that partial.
The target lookup SHALL recognize supported partial include directives with optional attributes and equivalent absolute or relative partial paths.
The generated xref SHALL preserve component and module qualification and SHALL use the explicit item ID as its fragment.

#### Scenario: Include attributes are present
- **WHEN** a page includes `include::partial$use-cases/validation.adoc[opts=optional]`
- **AND** a relationship targets an item defined in that partial
- **THEN** the relationship xref SHALL target the including page
- **AND** the include attributes SHALL not change target resolution

#### Scenario: Absolute and relative partial paths identify the same target
- **WHEN** the partial source is recorded with an absolute module path
- **AND** the page include uses the equivalent `partials/...` path
- **THEN** the target lookup SHALL resolve them to the same including page

#### Scenario: Unresolved partial target
- **WHEN** no including page matches a partial item after normalization
- **THEN** relationship link generation SHALL use the existing safe fallback
- **AND** SHALL NOT emit a link to the partial source file
