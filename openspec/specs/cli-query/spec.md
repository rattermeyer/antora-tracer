# CLI Query

## Purpose

Provide a `query` subcommand on the CLI that parses AsciiDoc source files directly — without an Antora build — and answers structural questions about the traceability graph: reverse edges, connected items, orphans, and shortest paths.

## Requirements

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

### Requirement: query isolated — find items with no relationships
The CLI SHALL provide `query isolated` that returns all items that have neither incoming nor outgoing relationships in the graph.

#### Scenario: Isolated items exist
- **WHEN** user runs `antora-tracer query isolated`
- **THEN** output lists every item with no relationships, including its role, title, and source file

#### Scenario: No isolated items
- **WHEN** user runs `antora-tracer query isolated` and every item has at least one relationship
- **THEN** output is empty and exit code is 0

#### Scenario: Isolated filtered by role
- **WHEN** user runs `antora-tracer query isolated --role requirement`
- **THEN** output lists only isolated items whose role matches `requirement`

### Requirement: query orphaned — find superseded items with no incoming functional links
The CLI SHALL provide `query orphaned` that returns all effectively superseded items that have no incoming functional (non-history) relationships.

#### Scenario: Orphaned items exist
- **WHEN** user runs `antora-tracer query orphaned`
- **AND** REQ-042 is superseded by REQ-043
- **AND** no functional relationship targets REQ-042
- **THEN** output lists REQ-042 including its role, title, source file, and direct successors

#### Scenario: Superseded but still in use is excluded
- **WHEN** REQ-042 is superseded by REQ-043
- **AND** ARC-001 still declares `addresses:REQ-042[]`
- **THEN** `query orphaned` does NOT list REQ-042

#### Scenario: History links do not prevent orphan status
- **WHEN** REQ-042 is superseded by REQ-043
- **AND** the only incoming relationship to REQ-042 is `REQ-043 supersedes REQ-042`
- **THEN** `query orphaned` lists REQ-042

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

### Requirement: query linked — find reachable items by role
The CLI SHALL provide `query linked <id> <role>` that returns each distinct item with the requested role reachable from the starting item by following outgoing graph relationships. Traversal SHALL follow relationships across any number of edges, continue through items of every role, and exclude the starting item from results. Results SHALL include each matching item once, including when paths converge or contain cycles.

#### Scenario: Find matching items through intermediate roles
- **WHEN** the graph contains `CHG-001 -> UC-001 -> REQ-001`, `REQ-002`, and `REQ-003`
- **AND** the user runs `antora-tracer query linked CHG-001 requirement`
- **THEN** output lists REQ-001, REQ-002, and REQ-003, even though they are more than one relationship away

#### Scenario: Traverse through items that do not match the requested role
- **WHEN** a reachable item has a different role from the requested role and has outgoing relationships to matching-role items
- **THEN** traversal continues through that item and returns the matching-role descendants

#### Scenario: Follow outgoing relationships only
- **WHEN** an item is connected to the starting item only by a relationship directed toward the starting item
- **THEN** that item is not considered reachable from the starting item

#### Scenario: Deduplicate convergent paths and terminate on cycles
- **WHEN** multiple paths reach the same matching-role item or the graph contains a cycle
- **THEN** the item appears once and traversal terminates

#### Scenario: No matching reachable items
- **WHEN** the starting item exists but no other item of the requested role is reachable by outgoing relationships
- **THEN** output is empty (header-only table or empty JSON array) and the command exits 0

#### Scenario: Unknown starting item
- **WHEN** the starting ID does not exist in the selected graph
- **THEN** the CLI reports that the item was not found and exits 1

#### Scenario: Local source input
- **WHEN** the user runs `antora-tracer query linked CHG-001 requirement --input docs/`
- **THEN** the CLI builds the graph from `.adoc` files under `docs/` and applies the linked query

#### Scenario: Complete Antora graph from a snapshot
- **WHEN** the user builds a snapshot with `antora-tracer site-graph antora-playbook.yml --out graph.json`
- **AND** runs `antora-tracer query linked CHG-001 requirement --snapshot graph.json`
- **THEN** the query searches items and relationships from the complete playbook content graph, including links across repositories

#### Scenario: Select one graph source
- **WHEN** the user explicitly supplies both `--snapshot` and local `--input` options
- **THEN** the CLI reports the conflicting graph sources and exits non-zero

#### Scenario: JSON output
- **WHEN** the user runs `antora-tracer query linked CHG-001 requirement --json`
- **THEN** output is a JSON array of matching full item objects, or `[]` when there are no matches

### Requirement: Multi-source linked queries require globally unique IDs
A complete multi-source graph query SHALL document globally unique item IDs as a prerequisite for unambiguous results. The CLI is not required to detect or reject duplicate IDs. Documentation SHALL recommend allocating IDs through the provided `@antora-tracer/id-server`, seeded from the Antora playbook and configured with shared allocation settings that keep IDs unique across included sources.

#### Scenario: Multi-source IDs are unique
- **WHEN** a snapshot contains globally unique item IDs across its source repositories
- **THEN** `query linked` resolves the start item and relationships by ID across the complete graph

#### Scenario: Multi-source ID uniqueness is documented
- **WHEN** a project configures linked queries over multiple repositories
- **THEN** the documented setup identifies globally unique IDs as a prerequisite and points to the provided ID server and playbook-based seed command
