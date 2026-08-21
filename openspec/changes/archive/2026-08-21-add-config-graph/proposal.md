## Why

The project's own traceability model — which roles exist and which relations are allowed between them — lives latently in `examples/traceability.yml` plus the `requirements-engineering` preset it extends.
A reader of the example site cannot see "what is our model in this project?" without reading raw YAML.
The same model is the thing users configure for their own projects, so a rendered picture doubles as a debugging aid: an orphaned role (declared but wired to nothing) becomes a visible isolated node instead of a silent config smell.

## What Changes

- **New `traceability:config-graph[]` macro** — renders the effective traceability configuration as a Kroki GraphViz diagram: roles as nodes (colored by the existing role palette), declared relations as labeled edges.
- **Declared directions only** — the diagram renders the `relations` block exactly. `inverseLabels` are not rendered; no derived reverse edges.
- **New config-graph generator** — turns the merged `ConfigLoader.getConfig()` into DOT, reusing the existing Kroki GraphViz pipeline.
- **New Explanation page** (`explanation/our-traceability-model.adoc`) — the generated graph alongside hand-written prose describing this project's specific roles and relations. Distinct from the existing generic `traceability-model.adoc`, which explains the concepts domain-agnostically.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `graph-visualization`: adds a requirement for the `traceability:config-graph[]` macro that renders the traceability configuration (roles and declared relations) as a Kroki GraphViz diagram, gated by the same `:traceability-graph:` attribute as the existing graph macros.

## Impact

- `src/antora-extension.ts` — new `traceability:config-graph[]` macro expansion (global scope, like `traceability:graph-coverage[]`), reusing `krokiUrl("graphviz", …)`.
- `src/config/TraceabilityConfig.ts` (or a small helper) — DOT generation from the merged config.
- `examples/tracer/modules/ROOT/pages/explanation/` — new `our-traceability-model.adoc` page with the graph and hand-written meanings; nav update and cross-link from `traceability-model.adoc`.
- `examples/tracer/modules/ROOT/pages/how-to/visualizations.adoc` — document the new macro.
- No new dependencies, no breaking changes.
