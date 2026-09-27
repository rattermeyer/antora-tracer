## ADDED Requirements

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
