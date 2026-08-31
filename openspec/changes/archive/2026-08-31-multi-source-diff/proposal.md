## Why

The `diff` command scans a single directory per side, so it under-diffs multi-repo Antora sites: items and relationships in other content sources are invisible, and cross-repo links dangle. Antora aggregates many sources into one content catalog, but the CLI never sees that catalog. Separately, `diffGraphs()` matches items by bare ID, so in a multi-component site the same ID in two components is conflated. A correct cross-version diff needs to harvest the full cross-source graph and match on component-qualified identity.

## What Changes

- Add a graph-only harvest that builds the complete traceability graph for a playbook's aggregated content (all content sources, components, and versions) without generating HTML/PDF/DOCX.
- Serialize the harvested graph to a canonical JSON snapshot — items and relationships, each item carrying `component`, `module`, and version scope.
- Diff two JSON snapshots directly — no checkout of either version is required at diff time — reporting added, removed, modified, and superseded items across the whole site.
- Extend `diffGraphs()` to match items by component-qualified identity (component + id, version when present), falling back to bare ID for the single-repo CLI case.
- The existing single-repo `diff` command and its output are unchanged.

## Capabilities

### New Capabilities

- `multi-source-diff`: Build the full cross-source traceability graph from a playbook without site output, serialize it to a JSON snapshot, and diff two snapshots with component-qualified item identity.

### Modified Capabilities

- `graph-diff`: The stable-ID matching requirement is tightened to component-qualified identity, so same-ID items in different components (or versions) are not conflated.

## Impact

- **GraphDiff**: `src/GraphDiff.ts` — component/version-aware match key.
- **New harvester**: a site-graph builder reusing `@antora/content-aggregator` and `@antora/content-classifier`, feeding the core `RequirementsTraceabilityExtension`.
- **Snapshot format**: a canonical graph JSON (items + relationships with scope) and a JSON→graph (or data-level) diff path.
- **CLI**: `src/cli.ts` — a `site-graph` command that emits a JSON snapshot, and a `diff-graphs` command that diffs two snapshots (existing `diff` unchanged).
- **Dependencies**: `@antora/content-aggregator` and `@antora/content-classifier` become direct (or optional) dependencies.
- **Docs**: update the diff-versions how-to and the CLI reference.
