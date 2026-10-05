## Purpose

Items can carry structured tags, and matrix authors can select relevant rows from item metadata without executing arbitrary code.

## ADDED Requirements

### Requirement: Items support header tags

An item declaration MAY include a `tags` attribute containing a comma-separated list of tags. The system SHALL expose the parsed tags as a list on the item, trimming surrounding whitespace and ignoring empty entries. Omitting `tags` SHALL produce an empty tag list. Existing item header syntax and other attributes SHALL remain compatible.

#### Scenario: Parse multiple tags from a quoted header attribute
- **WHEN** an item header contains `tags="security, privacy"`
- **THEN** the item's tags SHALL be `security` and `privacy`
- **AND** the tags SHALL NOT remain only as an unparsed generic attribute

#### Scenario: Omit tags
- **WHEN** an item header has no `tags` attribute
- **THEN** the item's tag list SHALL be empty

#### Scenario: Trim and ignore empty tags
- **WHEN** a tags attribute contains whitespace or empty comma-separated entries
- **THEN** each non-empty tag SHALL be trimmed
- **AND** empty entries SHALL be omitted

### Requirement: Matrix definitions filter rows by item metadata

A matrix definition MAY specify a row filter expression. The matrix SHALL include only current items of the configured row role for which the expression evaluates to true. If no row filter is configured, row selection SHALL remain unchanged. The expression SHALL support status equality/inequality and tag membership tests combined with logical `and`, `or`, and parentheses. Evaluation SHALL NOT execute arbitrary code.

#### Scenario: Select rows by status and tag
- **WHEN** a matrix row filter requires status `approved` and membership of tag `security`
- **AND** a current row item has that status and tag
- **THEN** the item SHALL appear as a matrix row

#### Scenario: Exclude rows that do not satisfy the expression
- **WHEN** a current row item does not satisfy the configured filter expression
- **THEN** the item SHALL NOT appear as a matrix row

#### Scenario: Preserve default row selection
- **WHEN** a matrix definition has no row filter
- **THEN** all current items with the configured row role SHALL remain eligible as rows

#### Scenario: Reject invalid filter expressions
- **WHEN** a matrix definition contains an invalid or unsupported row filter expression
- **THEN** configuration validation SHALL report the matrix name and filter error
- **AND** the expression SHALL NOT be executed as code
