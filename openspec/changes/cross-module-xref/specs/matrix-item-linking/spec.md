# matrix-item-linking (delta)

## ADDED Requirements

### Requirement: Matrix links include module path for module-aware items
When an item has module information (from Antora processing), the LinkResolver SHALL generate links that include the module name so the link navigates to the correct page under the correct module directory.

#### Scenario: Row item link includes module
- **WHEN** a matrix row item has `module: "ROOT"` and `sourceFile: "architecture"`
- **THEN** the HTML link SHALL be `../../ROOT/architecture.html#ID`
- **AND** the link navigates correctly in a multi-module Antora site

#### Scenario: Cell item link includes module
- **WHEN** a matrix cell item has `module: "requirements"` and `sourceFile: "index"`
- **THEN** the HTML link SHALL be `../../requirements/index.html#ID`

#### Scenario: Mixed module items in same matrix
- **WHEN** a matrix contains row items from `ROOT` and cell items from `requirements`
- **THEN** each link SHALL use the correct module for its target item
- **AND** all links navigate correctly

#### Scenario: Item without module generates unscoped link
- **WHEN** a matrix item has `module: undefined`
- **THEN** the HTML link SHALL be `../../page.html#ID` (backward-compatible, no module prefix)

#### Scenario: Existing tooltip behavior is preserved
- **WHEN** hovering over a matrix link for an item with module info
- **THEN** the tooltip SHALL display the source file path as before (e.g., "Source: architecture")
