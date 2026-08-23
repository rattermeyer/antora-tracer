## ADDED Requirements

### Requirement: Superseded items and links can be hidden
The system SHALL support a display-only `renderSuperseded` option. When set to false, superseded item blocks and the `supersedes`-related links in their successors SHALL be omitted from rendered output, without affecting the graph or matrices.

#### Scenario: Rendering suppressed
- **WHEN** `renderSuperseded` is false
- **AND** REQ-042 is superseded by REQ-043
- **THEN** the REQ-042 block SHALL NOT appear in rendered output
- **AND** the `supersedes:REQ-042[]` link in REQ-043 SHALL NOT render

#### Scenario: Default renders superseded items
- **WHEN** `renderSuperseded` is unset
- **THEN** superseded items and their links SHALL render as before

#### Scenario: Graph and matrices are unaffected
- **WHEN** `renderSuperseded` is false
- **THEN** the graph SHALL still contain the superseded item
- **AND** current-state matrices SHALL still omit it (unchanged behaviour)

### Requirement: Dangling history links are advisory
A dangling link whose type is `supersedes` or `superseded_by` SHALL be reported as an advisory worklist item, not a validation error. A dangling link of any other type SHALL remain a validation error.

#### Scenario: Dangling history link is not an error
- **WHEN** REQ-219 declares `supersedes:REQ-129[]`
- **AND** REQ-129 does not exist in the graph
- **THEN** validation SHALL NOT fail
- **AND** the link SHALL be reported in the dangling-reference worklist

#### Scenario: Dangling functional link is an error
- **WHEN** ARC-001 declares `addresses:REQ-999[]`
- **AND** REQ-999 does not exist in the graph
- **THEN** validation SHALL report an error
