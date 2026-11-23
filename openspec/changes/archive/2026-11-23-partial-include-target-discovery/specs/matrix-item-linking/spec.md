## MODIFIED Requirements

### Requirement: Matrix links resolve partial-defined items to rendered pages
The HTML matrix SHALL link an item defined in an Antora partial to the page that includes the partial.
The target lookup SHALL accept partial includes with optional attributes and normalize equivalent absolute and relative partial paths.
The partial source SHALL remain available for source metadata and tooltips but SHALL NOT be emitted as a navigable file URL.

#### Scenario: Matrix link resolves an include with attributes
- **WHEN** an HTML matrix contains an item defined in a partial included with attributes
- **THEN** the item link SHALL target the including page with the explicit item anchor
- **AND** the href SHALL NOT contain the partial source path

#### Scenario: Matrix link resolves an equivalent relative path
- **WHEN** an item source uses an absolute module path
- **AND** the including page uses the equivalent relative partial path
- **THEN** the matrix link SHALL resolve to the including page URL

#### Scenario: Matrix link has no discoverable target
- **WHEN** a partial item has no matching including page
- **THEN** the matrix SHALL preserve the existing safe fallback
- **AND** SHALL NOT emit a file URL to the partial
