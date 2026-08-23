## Why

The extension's `sitePublished` generation (matrices, coverage, and the supersession overview) reads a graph that the `contentClassified` pass has cleared down to the last component version's items. On multi-component sites — like the example's `tracer` + `blog` — the last component has no `[item]` blocks, so generation silently skips with "No traceable items found".

## What Changes

- The extension maintains a second, accumulated **full graph** spanning all components and versions, built by merging each version's working graph after its xref generation.
- `sitePublished` generation (matrices, coverage, overview) reads the full graph instead of the per-version working graph.
- Per-version xref isolation is unchanged (the working graph is still cleared per component version).

## Capabilities

### New Capabilities

- `graph-lifecycle`: the extension keeps a per-version working graph for xref isolation and an accumulated full graph for generation.

### Modified Capabilities

<!-- none -->

## Impact

- `src/antora-extension.ts` — full-graph field, merge step, generation methods
- Tests: `test/antora-extension.test.ts` (multi-component fixture)
- Docs: `explanation/processing-pipeline.adoc` (graph lifecycle)
