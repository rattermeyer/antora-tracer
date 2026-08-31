## 1. Item scope

- [x] 1.1 Add optional `version` field to the `Item` interface in `src/types.ts`
- [x] 1.2 Populate `version` from `file.src?.version` in `processAsciiDocFile`

## 2. Snapshot serialization

- [x] 2.1 Add a graph-to-snapshot serializer producing `{ format: 1, component, version, items, relationships }` with per-item scope and no `pubUrl`
- [x] 2.2 Add the serializer to the extension's file-generation path (reused alongside `MatrixGenerator`)

## 3. Per-version registration

- [x] 3.1 Serialize the version's graph after `canonicalizeRelationships()` in the `contentClassified` loop
- [x] 3.2 Register `traceability/graph.json` as an attachment per component version via `registerAttachmentInCatalog`, gated by `generateMatrices`
- [x] 3.3 Ensure unversioned components (empty-string version) still register a snapshot

## 4. Tests

- [x] 4.1 A version with items produces a `graph.json` attachment containing every item and relationship
- [x] 4.2 Snapshot items carry `component`, `module`, and `version` and exclude `pubUrl`
- [x] 4.3 No `graph.json` when `generateMatrices` is false
- [x] 4.4 No `graph.json` for a version with no traceable items
- [x] 4.5 A committed `graph.json` attachment is refreshed in place without a duplicate error

## 5. Documentation

- [x] 5.1 Mention the graph JSON snapshot in `reference/configuration.adoc` under matrix generation
- [x] 5.2 Note the snapshot workflow in the diff-versions how-to (`how-to/diff-versions.adoc`)
