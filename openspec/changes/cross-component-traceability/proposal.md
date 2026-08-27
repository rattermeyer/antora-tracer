## Why

Cross-component references are specified (REQ-117 `component:module:` xref prefix, REQ-119 cross-component `outgoing[]`/`incoming[]`) but never resolve end-to-end: `contentClassified` clears the working graph per `component@version`, so a relationship list on one component never sees items in a sibling component at the same version. The `tracer` + `demo` example exposes this — moving a requirement to `demo` makes every `addresses`/`leads_to`/`verifies` link to it dangling.

## What Changes

- Isolate the working graph per **version** (not per `component@version`), so items from different components at the same version share one graph and relationship macros render cross-component xrefs.
- Keep attachment registration (matrices, overview, guidance) per component + version.
- Move one requirement in the example site to the `demo` component so the self-traceability site exercises cross-component xrefs.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `graph-lifecycle`: the working graph now spans components within a version; cross-version isolation is unchanged.
- `traceability-links-macro`: the graph-isolation requirement is reworded from "per component version" to "per version" (cross-component within a version is allowed).
- `matrix-item-linking`: matrix links resolve from the site root via each item's published URL, so cross-component targets resolve.

## Impact

- `src/antora-extension.ts` — version-based grouping in `registerContentClassifier`
- Tests: `test/antora-extension.test.ts` — cross-component relationship-list fixture
- Example site: `examples/demo/` and `examples/tracer/modules/requirements/pages/index.adoc`
- Docs: `explanation/processing-pipeline.adoc` (graph lifecycle prose)
