# supersession-overview

## Purpose

Provide a generated overview page that reports supersession statistics and dangling references, so reviewers can see at a glance how much of the graph is superseded and which links point at removed items.

## Requirements

### Requirement: Overview page generation is opt-in and configurable
When the extension is configured with an overview target, the system SHALL generate an overview page reporting supersession statistics and dangling references.

#### Scenario: Configured target generates a page
- **WHEN** the extension config specifies an overview target (`component:module:page`)
- **THEN** the build SHALL produce the overview page at that location

#### Scenario: Not configured means no page
- **WHEN** no overview target is configured
- **THEN** no overview page SHALL be generated

### Requirement: Overview page reports graph totals
The overview page SHALL report the number of managed items, the number of active items, and the number of superseded items.

#### Scenario: Totals reflect the graph
- **WHEN** the graph contains 10 managed items, of which 7 are active and 3 are superseded
- **THEN** the overview page SHALL report managed=10, active=7, superseded=3

### Requirement: Overview page reports per-role statistics
The overview page SHALL report a per-role table with columns role, total, active, and superseded.

#### Scenario: Per-role breakdown
- **WHEN** the graph contains requirements and designs, some superseded
- **THEN** the table SHALL include one row per role with its total, active, and superseded counts

### Requirement: Overview page lists dangling references
The overview page SHALL list every dangling reference — a link whose target item does not exist — showing the source item as an xref, the relation type, and the missing target ID.

#### Scenario: Dangling reference is listed
- **WHEN** ARC-001 declares `addresses:REQ-999[]`
- **AND** REQ-999 does not exist in the graph
- **THEN** the worklist SHALL include a row linking to ARC-001, showing relation `addresses` and missing target `REQ-999`

#### Scenario: History link to a removed target is listed
- **WHEN** REQ-219 declares `supersedes:REQ-129[]`
- **AND** REQ-129 has been removed from the graph
- **THEN** the worklist SHALL include a row linking to REQ-219, showing relation `supersedes` and missing target `REQ-129`

#### Scenario: No dangling references
- **WHEN** every relationship targets an existing item
- **THEN** the worklist SHALL be empty
