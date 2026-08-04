# traceability-links-macro (delta)

## ADDED Requirements

### Requirement: Cross-module and cross-component xref resolution
When an item in one module has relationships to items in other modules or components, the `traceability:outgoing[]` and `traceability:incoming[]` macros SHALL generate xrefs with the correct Antora prefix (`component:module:` or `module:`) so Antora can resolve them correctly.

#### Scenario: Outgoing xref to an item in a different module
- **WHEN** `:traceability-links: true`
- **AND** an item in the `requirements` module has an outgoing relation to an item in the `ROOT` module (e.g., `REQ-001` addresses `ARC-001` defined in `modules/ROOT/pages/architecture.adoc`)
- **AND** `traceability:outgoing[]` is expanded
- **THEN** the xref for `ARC-001` SHALL be `xref:ROOT:architecture#ARC-001[...]`

#### Scenario: Outgoing xref to an item in a different component
- **WHEN** `:traceability-links: true`
- **AND** an item in component `tracer`, module `ROOT` has an outgoing relation to an item in component `other-comp`, module `ROOT`
- **AND** `traceability:outgoing[]` is expanded
- **THEN** the xref for the target SHALL be `xref:other-comp:ROOT:page#ID[...]`

#### Scenario: Incoming xref from an item in a different module
- **WHEN** `:traceability-links: true`
- **AND** an item in the `requirements` module has an incoming relation from an item in the `ROOT` module (e.g., `ARC-001` addresses `REQ-001`)
- **AND** `traceability:incoming[]` is expanded
- **THEN** the xref for `ARC-001` SHALL be `xref:ROOT:architecture#ARC-001[...]`

#### Scenario: Outgoing xref to an item in the same module
- **WHEN** both the current item and the target item are in the same component and module (`ROOT`)
- **AND** `traceability:outgoing[]` is expanded
- **THEN** the xref SHALL NOT include a module prefix (e.g., `xref:test-plan#TEST-001[...]`)

#### Scenario: Multiple related items across different modules
- **WHEN** an item has outgoing relations to items in two different modules (`ROOT` and `quality`)
- **AND** `traceability:outgoing[]` is expanded
- **THEN** each xref SHALL use the correct module prefix for its target
- **AND** the grouped output SHALL work correctly (list, table, or inline style)

#### Scenario: Item with no component/module info (CLI context)
- **WHEN** the target item has no `component` or `module` fields (e.g., items parsed via CLI)
- **THEN** the xref SHALL have no prefix (backward-compatible)
