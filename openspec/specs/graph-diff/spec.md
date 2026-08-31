# graph-diff

## Purpose

Derive a delta between two graph snapshots by stable item ID, classifying each item as added, removed, or modified, and expose the delta as a public API and a read-only CLI command that is independent of any preset or role vocabulary.

## Requirements

### Requirement: Diff classifies items by stable ID
When two graph snapshots are compared, the diff SHALL classify each item as added, removed, or modified based on its stable ID, scoped to the item's component and version when present.

#### Scenario: Added and removed items
- **WHEN** graph A contains `REQ-041` and `REQ-042`
- **AND** graph B contains `REQ-042` and `REQ-043`
- **THEN** the delta SHALL report `REQ-043` as added
- **AND** SHALL report `REQ-041` as removed

#### Scenario: Surviving item with no changes is not reported
- **WHEN** `REQ-042` has identical fields in both graphs
- **THEN** `REQ-042` SHALL NOT appear in the delta

#### Scenario: Same ID in different components is not conflated
- **WHEN** graph A contains `REQ-001` in component `foo`
- **AND** graph B contains `REQ-001` in component `bar`
- **THEN** the delta SHALL report the `foo` item as removed and the `bar` item as added
- **AND** SHALL NOT report a modified item

### Requirement: Modified items report changed fields
A surviving item SHALL be reported as modified when its `title`, `content`, `role`, `status`, or `attributes` differs between the snapshots, and the delta SHALL name the changed fields.

#### Scenario: Content change is reported
- **WHEN** `REQ-042` has a different `content` in graph B than in graph A
- **THEN** the delta SHALL report `REQ-042` as modified
- **AND** SHALL name `content` as a changed field

### Requirement: Relationship deltas are limited to surviving items
The diff SHALL report relationship changes only between items that exist in both snapshots.

#### Scenario: Removed item's relationships are not listed separately
- **WHEN** `REQ-041` is removed from graph B
- **AND** `REQ-041` had an `addresses` relationship in graph A
- **THEN** the removed relationship SHALL NOT be reported as a separate relationship delta

#### Scenario: Changed link on a surviving item is reported
- **WHEN** `DES-007` exists in both snapshots
- **AND** `DES-007` `addresses` a new target in graph B
- **THEN** the delta SHALL report the new relationship

### Requirement: The diff does not attempt rename detection
The diff SHALL NOT attempt content-similarity rename detection.

#### Scenario: No rename heuristic
- **WHEN** two graphs differ only in a renumbered item with similar content
- **THEN** the diff SHALL NOT infer a rename

### Requirement: A superseded predecessor is reported as removed and its successor as added
A superseded predecessor SHALL appear as removed and its successor as added, with the `supersedes` relationship reported as a new relationship.

#### Scenario: Superseded pair
- **WHEN** graph B contains `REQ-043` with `supersedes:REQ-042[]`
- **AND** `REQ-042` is absent from graph B
- **THEN** `REQ-042` SHALL be reported as removed
- **AND** `REQ-043` SHALL be reported as added
- **AND** the `REQ-043 supersedes REQ-042` relationship SHALL be reported as a new relationship

### Requirement: Diff is a public, config-agnostic API
The diff SHALL be exposed as a public function usable with any configured role or relation vocabulary, without hardcoding any role name.

#### Scenario: Function compares two graphs
- **WHEN** a caller invokes the exported `diffGraphs(oldGraph, newGraph)` function
- **THEN** the function SHALL return a `GraphDiff` containing item and relationship deltas

### Requirement: CLI diff is read-only
A `diff` CLI command SHALL scan two source paths, build two graphs, and print the delta without modifying any source file.

#### Scenario: CLI reports the delta
- **WHEN** `antora-tracer diff --from docs-v1 --to docs-v2` runs
- **THEN** the output SHALL list added, removed, and modified items
- **AND** SHALL NOT modify any AsciiDoc file

#### Scenario: JSON output
- **WHEN** `antora-tracer diff --from docs-v1 --to docs-v2 --json` runs
- **THEN** the output SHALL be machine-readable JSON containing the delta
