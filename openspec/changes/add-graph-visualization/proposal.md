## Why

Traceability data is currently only visible as text (matrices, link lists, CSV/Neo4j exports). Stakeholders and developers need visual representations — relationship graphs showing how requirements connect to designs, implementations, and tests — to quickly understand coverage gaps and dependency chains. With Kroki already integrated for diagram rendering, adding graph visualization is a natural extension with zero new dependencies.

## What Changes

- Add `toDot()` method to `TraceabilityGraph` for generating GraphViz DOT source from items and relationships
- Add `toVegaLite()` method for generating Vega-Lite JSON specs for coverage bar charts
- Add `traceability:graph[]` inline macro — renders relationship graph for the enclosing item via Kroki
- Add `traceability:graph-coverage[]` inline macro — renders per-item or global coverage chart via Kroki
- Add `:traceability-graph:` document attribute to toggle graph rendering (same pattern as `:traceability-links:`)
- Add dashboard page to example site with global coverage chart
- Extend `antora-extension.ts` with `expandGraphMacros()` following the existing `expandOutgoingMacros()` pattern

## Capabilities

### New Capabilities

- `graph-visualization`: Generate relationship graphs and coverage charts from the traceability graph, rendered as Kroki images in both HTML and PDF output. Configurable via document attributes with opt-in toggle.

### Modified Capabilities

_None._

## Impact

- **New methods**: `TraceabilityGraph.toDot()` and `TraceabilityGraph.toVegaLite()` — ~100 lines
- **Extension**: `antora-extension.ts` gains two new macro expanders (~80 lines following existing patterns)
- **Example site**: New `dashboard.adoc` page, new nav entry
- **Documentation**: User guide updated with new macros and attribute
- **No new dependencies**: Kroki already handles GraphViz and Vega-Lite
