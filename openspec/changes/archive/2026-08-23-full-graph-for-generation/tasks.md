## 1. Full graph

- [x] 1.1 Add a `fullGraph` field (a `TraceabilityGraph` sharing the working extension's config loader), created during init
- [x] 1.2 Clear the full graph at the start of each `contentClassified` pass
- [x] 1.3 Merge each version's working graph into the full graph after processing that version

## 2. Generation reads the full graph

- [x] 2.1 Point `generateTraceabilityFiles`, `generateMatrixFiles`, `generateCoverageReport`, and `generateOverviewContent` at the full graph

## 3. Tests

- [x] 3.1 Add a multi-component fixture test asserting matrices and the overview include all items
- [x] 3.2 Keep an xref-isolation assertion (per-version xrefs do not cross)

## 4. Docs

- [x] 4.1 Update `explanation/processing-pipeline.adoc` with the two-graph lifecycle
