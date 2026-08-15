# CLI Query

## Purpose

Provide a `query` subcommand on the CLI that parses AsciiDoc source files directly — without an Antora build — and answers structural questions about the traceability graph: reverse edges, connected items, orphans, and shortest paths.

## Requirements

### Requirement: CLI exposes a query subcommand
The CLI SHALL provide a `query` subcommand that parses AsciiDoc source files, builds the in-memory traceability graph, and answers one structural question per invocation.
No Antora build SHALL be required.

#### Scenario: Help lists all query subcommands
- **WHEN** user runs `antora-tracer query --help`
- **THEN** output lists all available query subcommands with a one-line description each

#### Scenario: Default input directory is current directory
- **WHEN** user runs `antora-tracer query reverse REQ-001` without `--input`
- **THEN** the CLI parses `.adoc` files in the current working directory recursively

#### Scenario: Explicit input directory
- **WHEN** user runs `antora-tracer query reverse REQ-001 --input docs/`
- **THEN** the CLI parses `.adoc` files under `docs/` recursively

### Requirement: query reverse — find all items that point at a given ID
The CLI SHALL provide `query reverse <id>` that returns all items whose relationship macros reference the given item ID.

#### Scenario: Item has inbound relationships
- **WHEN** user runs `antora-tracer query reverse REQ-005`
- **THEN** output lists every item that references REQ-005 via any relationship macro, including the relationship type and the source file and line

#### Scenario: Item has no inbound relationships
- **WHEN** user runs `antora-tracer query reverse REQ-999` and no item references REQ-999
- **THEN** output is empty (table with header only, or empty JSON array) and exit code is 0

#### Scenario: Unknown item ID
- **WHEN** user runs `antora-tracer query reverse UNKNOWN-001` and UNKNOWN-001 does not exist as an item in the graph
- **THEN** CLI prints a warning that the item was not found and exits with code 1

### Requirement: query impact — find all items connected to a given ID
The CLI SHALL provide `query impact <id>` that returns all items transitively connected to the given item (its connected component, excluding the item itself), following relationships in both directions.

#### Scenario: Item with related items
- **WHEN** user runs `antora-tracer query impact REQ-001`
- **THEN** output lists every item transitively connected to REQ-001, with its role and title

#### Scenario: Item with no related items
- **WHEN** user runs `antora-tracer query impact TST-010` and TST-010 has no relationships in either direction
- **THEN** output is empty and exit code is 0

### Requirement: query orphaned — find items with no relationships
The CLI SHALL provide `query orphaned` that returns all items that have neither incoming nor outgoing relationships in the graph.

#### Scenario: Orphaned items exist
- **WHEN** user runs `antora-tracer query orphaned`
- **THEN** output lists every item with no relationships, including its role, title, and source file

#### Scenario: No orphaned items
- **WHEN** user runs `antora-tracer query orphaned` and every item has at least one relationship
- **THEN** output is empty and exit code is 0

#### Scenario: Orphaned filtered by role
- **WHEN** user runs `antora-tracer query orphaned --role requirement`
- **THEN** output lists only orphaned items whose role matches `requirement`

### Requirement: query path — find the shortest path between two items
The CLI SHALL provide `query path <from-id> <to-id>` that returns the shortest relationship path between two items in the graph.

#### Scenario: Path exists
- **WHEN** user runs `antora-tracer query path REQ-001 TST-012`
- **THEN** output lists the sequence of items and relationship types from REQ-001 to TST-012

#### Scenario: No path exists
- **WHEN** user runs `antora-tracer query path REQ-001 TST-099` and no path connects them
- **THEN** CLI prints "No path found" and exits with code 1

### Requirement: JSON output flag
All `query` subcommands SHALL accept a `--json` flag that switches output to a machine-readable JSON array.

#### Scenario: Human-readable default
- **WHEN** user runs `antora-tracer query reverse REQ-001` without `--json`
- **THEN** output is a formatted table with columns appropriate to the subcommand

#### Scenario: JSON output
- **WHEN** user runs `antora-tracer query reverse REQ-001 --json`
- **THEN** output is a JSON array where each element contains the full item or relationship fields matching the existing `Item` and `ItemRelationship` interfaces

#### Scenario: JSON output is valid for empty results
- **WHEN** user runs `antora-tracer query reverse UNKNOWN-001 --json` and no results exist
- **THEN** output is `[]` and exit code is 0 (unless item not found, in which case exit code is 1)
