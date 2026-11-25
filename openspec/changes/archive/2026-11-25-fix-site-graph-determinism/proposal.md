## Why

`site-graph` serializes the same unchanged tree differently between runs, so
`diff-graphs` reports phantom deltas and cannot back a change-approval step.
Two defects combine:

1. `harvestSiteFiles` returns files in Antora's `findBy` order, which is not
   stable across runs. The graph records edges in ingestion order, so the
   serialized relationship list varies.
2. The `site-graph` and `seed` commands never call
   `TraceabilityGraph.canonicalizeRelationships()`. A reverse-authored relation
   (`verified_by:` for a `verifies:` primary) is flipped to its primary
   direction only when both endpoints already exist, so when the authoring
   file is ingested before the file that defines the other endpoint, the edge
   is stored in its authored direction. `neo4j` and the extension's Antora path
   both canonicalize; these two commands do not.

The direction flip is order-dependent, which is why it alternated between runs
in the report.

## What Changes

- `harvestSiteFiles` SHALL return files in a deterministic order (component,
  version, module, path).
- A shared harvest helper SHALL feed every file into the graph and run the
  collection-boundary canonicalization once, and the `site-graph`, `seed`, and
  `neo4j` commands SHALL use it instead of their duplicated inline loops.
- Two regression tests: canonical direction regardless of which endpoint is
  read first, and a stable harvest order on the real multi-source playbook.

No public API, configuration, or CLI-option change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multi-source-diff`: the "Graph snapshots serialize to JSON" requirement gains
  a deterministic-snapshot obligation (stable order and canonical relation
  direction), so two harvests of an unchanged tree produce identical snapshots.

## Impact

- `src/SiteGraph.ts` — deterministic order; new `harvestIntoGraph` helper
- `src/cli.ts` — `site-graph`, `seed`, `neo4j` use the helper
- `src/index.ts` — re-export the helper
- `test/graph-snapshot.test.ts` — two regression tests
- `openspec/specs/multi-source-diff/spec.md` — snapshot determinism
- `examples/tracer/modules/requirements/pages/index.adoc` — REQ item for the
  new requirement
