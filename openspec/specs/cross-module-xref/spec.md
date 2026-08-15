# cross-module-xref

## Purpose

Preserve Antora module context when processing `[item]` macros so that xrefs and matrix links correctly navigate across module boundaries within a component version.

## Requirements

### Requirement: Items carry component and module context from Antora
When processing `.adoc` files through the Antora extension, the system SHALL store the Antora component and module names on each `Item` so that downstream xref and link generation can distinguish same-module from cross-module and cross-component references.

#### Scenario: Item in ROOT module gets component and module attributes
- **WHEN** an `[item]` macro is parsed from a file in component `tracer`, module `ROOT` (e.g., `modules/ROOT/pages/architecture.adoc`)
- **THEN** the resulting `Item` SHALL have `component` set to `"tracer"` and `module` set to `"ROOT"`

#### Scenario: Item in custom module gets component and module attributes
- **WHEN** an `[item]` macro is parsed from a file in component `tracer`, module `requirements` (e.g., `modules/requirements/pages/index.adoc`)
- **THEN** the resulting `Item` SHALL have `component` set to `"tracer"` and `module` set to `"requirements"`

#### Scenario: Item from partial gets component and module attributes
- **WHEN** an `[item]` macro is parsed from a partial in component `tracer`, module `ROOT`
- **THEN** the resulting `Item` SHALL have `component` set to `"tracer"` and `module` set to `"ROOT"`
- **AND** `sourceFile` is a full URL (view URL, existing behavior for partials)

#### Scenario: Item parsed via CLI has no component or module
- **WHEN** an `[item]` macro is parsed outside of the Antora extension (e.g., CLI or standalone use)
- **THEN** the resulting `Item` SHALL have `component` and `module` set to `undefined`
- **AND** xref generation behaves as before (context-agnostic)

---

### Requirement: Cross-module and cross-component xref includes correct prefix
When `buildXref` generates an Antora xref for an item in a different module or component than the current page, the system SHALL include the appropriate prefix matching Antora's xref resolution hierarchy: `component:module:` for cross-component, `module:` for cross-module, and no prefix for same-module.

#### Scenario: Same-module xref has no prefix
- **WHEN** `buildXref` is called for a target item with `component: "tracer"`, `module: "ROOT"` and the current page is also in component `tracer`, module `ROOT`
- **THEN** the generated xref SHALL be `xref:page#ID[...]` (no prefix)

#### Scenario: Cross-module xref includes module prefix
- **WHEN** `buildXref` is called for a target item with `component: "tracer"`, `module: "ROOT"` and the current page is in component `tracer`, module `requirements`
- **THEN** the generated xref SHALL be `xref:ROOT:page#ID[...]`

#### Scenario: Cross-component xref includes component and module prefix
- **WHEN** `buildXref` is called for a target item with `component: "other-comp"`, `module: "ROOT"` and the current page is in component `tracer`, module `ROOT`
- **THEN** the generated xref SHALL be `xref:other-comp:ROOT:page#ID[...]`

#### Scenario: Same component, same module, no explicit comparison needed
- **WHEN** `buildXref` is called and the target item's component and module are both undefined
- **THEN** the generated xref SHALL be `xref:page#ID[...]` (no prefix, backward-compatible)

#### Scenario: Partial item (same-page anchor) is unaffected
- **WHEN** `buildXref` is called for a target item whose `sourceFile` contains `/partials/`
- **THEN** the generated xref SHALL be `xref:#ID[...]` (same-page anchor, existing behavior)

#### Scenario: Full URL source file is unaffected
- **WHEN** `buildXref` is called for a target item whose `sourceFile` is a full URL
- **THEN** the generated output SHALL be `link:URL#ID[...]` (existing behavior)

---

### Requirement: Matrix links include module path when available
When a matrix item has module information, the system SHALL include the module name in the URL path of its HTML link.

#### Scenario: Item with module generates module-scoped link
- **WHEN** LinkResolver generates a link for an item with `module: "ROOT"` and `sourceFile: "architecture"`
- **THEN** the generated HTML link SHALL be `../../ROOT/architecture.html#ID`

#### Scenario: Item without module generates unscoped link
- **WHEN** LinkResolver generates a link for an item with `module: undefined` and `sourceFile: "architecture"`
- **THEN** the generated HTML link SHALL be `../../architecture.html#ID` (backward-compatible)

#### Scenario: Subdirectory sourceFile with module
- **WHEN** LinkResolver generates a link for an item with `module: "ROOT"` and `sourceFile: "traceability/index"`
- **THEN** the generated HTML link SHALL be `../../ROOT/traceability/index.html#ID`
