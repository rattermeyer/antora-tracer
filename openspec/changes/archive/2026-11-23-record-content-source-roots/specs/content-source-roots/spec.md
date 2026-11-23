## Purpose

Harvested items identify the content-source root their relative source path belongs to, so that an
item — not just a component, module, and version — resolves to exactly one file on disk in a
multi-source harvest.

## ADDED Requirements

### Requirement: Harvested files record their content-source root

When files are harvested from a playbook, each harvested file SHALL record the root directory of the
content source it came from, derived from the source's repository location and the source's start
path, so that the file's relative path resolves to exactly one file on disk.

#### Scenario: Local content source records its root

- **WHEN** a playbook declares the local directory `examples/tracer` as a content source
- **AND** a file `modules/ROOT/pages/index.adoc` is harvested from it
- **THEN** the harvested file SHALL record a root such that the root joined with the relative path is
  an existing file

#### Scenario: Two sources with identical relative paths

- **WHEN** two content sources each contain `modules/ROOT/pages/index.adoc`
- **THEN** the two harvested files SHALL record different roots
- **AND** each root joined with the relative path SHALL resolve to the file in its own source

#### Scenario: Source metadata absent

- **WHEN** a content source provides no repository location or start path
- **THEN** the harvested file SHALL record no root
- **AND** harvesting SHALL NOT fail or invent a path

### Requirement: Items carry their source root

An item built from a harvested file SHALL carry that file's content-source root alongside its
component, module, and version scope, so a consumer holding only the item can resolve its source
file.

#### Scenario: Item resolves to its file

- **WHEN** an item is built from a harvested file in a multi-source harvest
- **THEN** the item SHALL carry the file's source root
- **AND** the root joined with the item's `sourceFile` SHALL be an existing file

#### Scenario: Local parse without a playbook

- **WHEN** items are built from local files without a playbook harvest
- **THEN** the items SHALL still carry their component, module, and version as before
- **AND** they MAY omit the source root

### Requirement: Source roots are excluded from serialized snapshots

The canonical graph snapshot SHALL NOT contain content-source roots, so that a snapshot is not tied
to a build machine's filesystem layout and two harvests taken on different machines remain
comparable.

#### Scenario: Serialized snapshot contains no absolute source root

- **WHEN** a harvested graph is serialized to a snapshot
- **THEN** no item in the snapshot SHALL carry a content-source root
- **AND** no item in the snapshot SHALL carry an absolute filesystem path

#### Scenario: Snapshot round-trips without the root

- **WHEN** a snapshot that omits source roots is deserialized
- **THEN** deserialization SHALL succeed
- **AND** the restored items SHALL keep their component, module, and version scope

#### Scenario: Published graph attachment keeps its field set

- **WHEN** the extension publishes `traceability/graph.json` for a component version
- **THEN** the published snapshot SHALL contain the documented item fields and no source root
- **AND** it SHALL NOT contain a build-machine path

### Requirement: Local resolution prefers the recorded root

When a consumer resolves an item's relative source path to a file, it SHALL prefer the item's
recorded content-source root, and SHALL fall back to the consumer's own input directory when no root
is recorded.

#### Scenario: CLI resolves against the recorded root

- **WHEN** a CLI command reads or writes an item's source file and the item carries a source root
- **THEN** the file SHALL be resolved against that root

#### Scenario: CLI fallback without a root

- **WHEN** a CLI command operates on locally parsed items that carry no source root
- **THEN** the file SHALL be resolved against the command's input directory, as before

#### Scenario: Resolution stays inside the root

- **WHEN** resolving an item's source path against its root
- **THEN** a path that escapes the root SHALL be rejected rather than read or written
