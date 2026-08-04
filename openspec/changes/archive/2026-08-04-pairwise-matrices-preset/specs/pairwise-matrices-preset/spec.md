# pairwise-matrices-preset

## Purpose

The `requirements-engineering` preset SHALL define pairwise traceability matrices where each matrix maps exactly one source role to exactly one target role, following the forward traceability chain.

## ADDED Requirements

### Requirement: Preset defines pairwise requirements-to-design matrix
The `requirements-engineering` preset SHALL include a matrix named `requirements-to-design` with `requirement` rows and a single `design` column.

#### Scenario: Matrix matches requirements to their addressed designs
- **WHEN** the preset is loaded
- **THEN** the `requirements-to-design` matrix SHALL have `rows: requirement` and `columns: [design]`
- **AND** `coverageRelations.design` SHALL include `addresses` and `satisfies`

### Requirement: Preset defines pairwise design-to-implementation matrix
The `requirements-engineering` preset SHALL include a matrix named `design-to-implementation` with `design` rows and a single `implementation` column.

#### Scenario: Matrix matches designs to their implementing artifacts
- **WHEN** the preset is loaded
- **THEN** the `design-to-implementation` matrix SHALL have `rows: design` and `columns: [implementation]`
- **AND** `coverageRelations.implementation` SHALL include `implements` and `realized_by`

### Requirement: Preset defines pairwise requirements-to-tests matrix
The `requirements-engineering` preset SHALL include a matrix named `requirements-to-tests` with `requirement` rows and a single `test` column.

#### Scenario: Matrix matches requirements to their direct test coverage
- **WHEN** the preset is loaded
- **THEN** the `requirements-to-tests` matrix SHALL have `rows: requirement` and `columns: [test]`
- **AND** `coverageRelations.test` SHALL include `covers` and `verifies`

### Requirement: Preset does not define wide multi-column matrices
The `requirements-engineering` preset SHALL NOT define matrices with more than one column role.

#### Scenario: No wide matrices in preset
- **WHEN** the preset is loaded
- **THEN** all matrix definitions SHALL have exactly one entry in their `columns` array
- **AND** the previous wide matrix names (`requirements-traceability`, `design-verification`, `implementation-coverage`, `test-coverage`) SHALL NOT be present
