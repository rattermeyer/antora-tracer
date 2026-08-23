## MODIFIED Requirements

### Requirement: Matrix renders one status column per row
The HTML matrix SHALL render exactly one per-row status column.

#### Scenario: One status column
- **WHEN** a matrix is exported to HTML
- **THEN** each row SHALL render one status column
- **AND** no per-row coverage percentage column SHALL be rendered
