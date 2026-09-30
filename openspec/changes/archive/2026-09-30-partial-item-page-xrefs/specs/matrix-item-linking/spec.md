## MODIFIED Requirements

### Requirement: Matrix links resolve partial-defined items to rendered pages
The HTML matrix SHALL link an item defined in an Antora partial to the page that includes the partial.
The link SHALL use the including page's published URL and the item's explicit ID fragment.
The partial source SHALL remain available for source metadata and tooltips but SHALL NOT be emitted as a navigable file URL.

#### Scenario: Matrix row links to an item defined in a partial
- **WHEN** an HTML matrix contains row item `UC-007`
- **AND** `UC-007` is defined in a partial included by `tracer` `ROOT` page `self-traceability/use-cases`
- **THEN** the generated link SHALL resolve to `/tracer/stable/self-traceability/use-cases.html#UC-007`

#### Scenario: Matrix cell links to an item defined in a partial
- **WHEN** an HTML matrix contains `UC-007` as a cell item
- **AND** the partial target page is known
- **THEN** the cell link SHALL use the same rendered page URL and `#UC-007` fragment as a row link

#### Scenario: Partial item source tooltip is preserved
- **WHEN** a matrix link targets an item defined in a partial
- **THEN** its source tooltip SHALL identify the partial source
- **AND** its href SHALL identify the including page rather than the partial source

#### Scenario: Partial target is unavailable
- **WHEN** a matrix item comes from a partial with no discoverable including page
- **THEN** the matrix SHALL not emit a file URL to the partial
- **AND** existing no-link or safe fallback behavior SHALL be preserved
