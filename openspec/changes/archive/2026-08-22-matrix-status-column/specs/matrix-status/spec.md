# matrix-status

## Purpose

A matrix row SHALL render a single status value (`done`, `partial`, or `missing`) derived from its coverage, without a separate per-row coverage percentage column.

## ADDED Requirements

### Requirement: Matrix renders one status column per row
The HTML matrix SHALL render exactly one per-row status column, and SHALL NOT render a separate per-row coverage percentage column.

#### Scenario: Single status column replaces Coverage and Status
- **WHEN** a matrix is exported to HTML
- **THEN** each row SHALL render one status cell showing `done`, `partial`, or `missing`
- **AND** no per-row `%` coverage cell SHALL be rendered

#### Scenario: Status values are done, partial, missing
- **WHEN** a row has links in every column
- **THEN** its status SHALL be `done`
- **WHEN** a row has links in some but not all columns
- **THEN** its status SHALL be `partial`
- **WHEN** a row has no links in any column
- **THEN** its status SHALL be `missing`

### Requirement: Coverage summary remains
The matrix SHALL still render a top-level coverage summary with the counts of done/partial/missing rows and an overall percentage of done rows.

#### Scenario: Overall coverage is preserved
- **WHEN** a matrix is exported to HTML
- **THEN** the summary SHALL show the number of `done` rows out of the total
- **AND** SHALL show an overall coverage percentage computed from the share of `done` rows

### Requirement: CSV output is unchanged
The CSV export SHALL NOT render a per-row status or coverage column, matching its current behavior.

#### Scenario: CSV has cells and an overall coverage line only
- **WHEN** a matrix is exported to CSV
- **THEN** the header SHALL contain the row ID, row title, and one column per matrix column
- **AND** no per-row status or coverage column SHALL be present
