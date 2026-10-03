# CLI Query

## MODIFIED Requirements

### Requirement: CLI exposes a query subcommand
The CLI SHALL provide a `query` subcommand that reads AsciiDoc source files and answers one structural question about items and their relationships per invocation.
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

## ADDED Requirements

### Requirement: query siblings — find items sharing neighbors with a given ID
The CLI SHALL provide `query siblings <id>` that returns all items sharing at least one typed neighbor with the given item, following the sibling query semantics of the functional-siblings capability.
Output SHALL list each sibling with its role, title, the shared neighbor IDs, and its supersession status.
The command SHALL accept a canonical `site-graph` snapshot as input, so sibling queries work on the cross-source graph built from an Antora playbook, and SHALL reject combining a snapshot with an explicit local input directory.

#### Scenario: Item has siblings
- **WHEN** user runs `antora-tracer query siblings PRQ-004` and PRQ-009 validates the same requirement as PRQ-004
- **THEN** output lists PRQ-009 with its role, title, shared neighbor, and supersession status

#### Scenario: Siblings filtered by relation type
- **WHEN** user runs `antora-tracer query siblings PRQ-004 --relation validates`
- **THEN** output lists only siblings whose shared-neighbor connection uses the `validates` relation type

#### Scenario: Siblings queried from a cross-source snapshot
- **WHEN** user runs `antora-tracer query siblings <id> --snapshot site-graph.json` with a snapshot built from a multi-source Antora playbook
- **THEN** output lists siblings discovered across all sources in the snapshot, not only items from a single local directory

#### Scenario: Snapshot combined with explicit input is rejected
- **WHEN** user runs `antora-tracer query siblings <id> --snapshot site-graph.json --input docs/`
- **THEN** the CLI exits with code 1 and an error stating that snapshot and input cannot be combined

#### Scenario: Item has no siblings
- **WHEN** user runs `antora-tracer query siblings REQ-999` and no item shares a neighbor with REQ-999
- **THEN** output is empty (table with header only, or empty JSON array) and exit code is 0

#### Scenario: Unknown item ID
- **WHEN** user runs `antora-tracer query siblings UNKNOWN-001` and UNKNOWN-001 does not exist as an item in the graph
- **THEN** CLI prints a warning that the item was not found and exits with code 1
