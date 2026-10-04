# CLI Query

## ADDED Requirements

### Requirement: query by-role — extract items of one role
The CLI SHALL provide `query by-role <role>` that returns all current (non-superseded) items of the given role, each with its ID, role, title, content, source file, and source line, ordered by source position within each document.
The command SHALL accept an optional document path filter, an optional skeleton-context flag, and SHALL support cross-source `site-graph` snapshots, and SHALL reject combining a snapshot with an explicit local input directory.

#### Scenario: Extract a role across all scanned documents
- **WHEN** user runs `antora-tracer query by-role requirement -i docs/`
- **THEN** output lists every current requirement item with its ID, title, source file, and source line, grouped in document order

#### Scenario: Extract a role from one document
- **WHEN** user runs `antora-tracer query by-role design --document explanation/architecture`
- **THEN** output lists only the design items whose source file matches the given path

#### Scenario: Extraction filtered by role with no matches
- **WHEN** user runs `antora-tracer query by-role risk` and no item has the role `risk`
- **THEN** output is empty (table with header only, or empty JSON array) and exit code is 0

#### Scenario: Superseded items are excluded
- **WHEN** the requested role includes superseded items
- **THEN** output lists only current items

#### Scenario: Skeleton context included
- **WHEN** user runs `antora-tracer query by-role design --document explanation/architecture --context`
- **THEN** JSON output carries the document's other-role items as ID and title alongside the extracted slice

#### Scenario: Snapshot combined with explicit input is rejected
- **WHEN** user runs `antora-tracer query by-role design --snapshot graph.json --input docs/`
- **THEN** the CLI exits with code 1 and an error stating that snapshot and input cannot be combined
