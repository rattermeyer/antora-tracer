## 1. Site-graph harvest

- [x] 1.1 Add a graph-only harvest that runs `aggregateContent` + `classifyContent` for a playbook and returns a populated `TraceabilityGraph`
- [x] 1.2 Harvest `.adoc` pages and partials with `component`, `module`, and version metadata
- [x] 1.3 Feed harvested files into `RequirementsTraceabilityExtension.process()` with scope metadata

## 2. Snapshot serialization

- [x] 2.1 Define the canonical snapshot format (`{ format: 1, items, relationships }` with scope fields)
- [x] 2.2 Add a graph-to-JSON serializer and a JSON→graph (or data-level) loader
- [x] 2.3 Add a `site-graph` CLI command that emits a snapshot to `--out`

## 3. Component-qualified identity in diffGraphs

- [x] 3.1 Change the item match key to component (+ version when present) + id, falling back to bare id
- [x] 3.2 Add regression tests proving single-repo `diff` behavior is unchanged

## 4. JSON-consuming diff

- [x] 4.1 Add a `diff-graphs` command that accepts two JSON snapshots and rejects unknown `format` values
- [x] 4.2 Render added, removed, modified, and superseded items in table and `--json` form

## 5. Tests

- [x] 5.1 A multi-source playbook harvest produces one merged graph spanning components
- [x] 5.2 Same ID in different components is not conflated
- [x] 5.3 Diffing two JSON snapshots reports cross-repo added, removed, and superseded items

## 6. Documentation

- [x] 6.1 Update the diff-versions how-to with the snapshot workflow
- [x] 6.2 Update the CLI reference for `site-graph` and the JSON diff options
