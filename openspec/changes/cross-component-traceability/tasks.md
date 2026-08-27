## 1. Graph isolation

- [x] 1.1 Group the working graph by `version` in `registerContentClassifier` (was `component@version`)
- [x] 1.2 Build a version → components map and register matrices, overview, and guidance per component + version
- [x] 1.3 Update the duplicate-ID error summary for the version-only grouping

## 2. Tests

- [x] 2.1 Add a test: two components at the same version, one referencing the other, relationship list renders a cross-component xref
- [x] 2.2 Keep the multi-component full-graph test passing

## 3. Example site demo and docs

- [x] 3.1 Move REQ-109 to `examples/demo/modules/ROOT/pages/index.adoc` with `:traceability-links: true`
- [x] 3.2 Rebuild with `npx antora antora-playbook.yml` and verify cross-component xrefs resolve
- [x] 3.3 Update `explanation/processing-pipeline.adoc` prose about the graph lifecycle
- [x] 3.4 Reword REQ-103 ("per version") in the requirements index, its spec delta, and `explanation/architecture.adoc`
