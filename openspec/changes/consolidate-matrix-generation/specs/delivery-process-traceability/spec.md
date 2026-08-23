## MODIFIED Requirements

### Requirement: Process-to-product matrix exists
The example site configuration SHALL define a `process-to-product` matrix with `process_requirement` as rows, `requirement` as columns, and `validates` as the coverage relation.

#### Scenario: Process matrix is generated
- **WHEN** the example site is built
- **THEN** the extension SHALL generate a `matrix-process-to-product.html` file
- **AND** the matrix SHALL show which process requirements cover which product requirements
