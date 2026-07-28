## Context

The Antora Tracer already uses Kroki for PlantUML diagram rendering in PDFs. Kroki also supports GraphViz (directed graphs) and Vega-Lite (declarative charts). The `TraceabilityGraph` already has `getRelationships()`, `getReverseRelationships()`, `getRoleStatistics()`, and `findPath()` — all the data needed for visualization queries.

## Goals / Non-Goals

**Goals:**
- Generate per-item relationship graphs as GraphViz DOT via Kroki
- Generate coverage bar charts as Vega-Lite JSON via Kroki
- Opt-in via `:traceability-graph:` document attribute
- Work identically in HTML and PDF output
- Dashboard page with global coverage view

**Non-Goals:**
- Interactive/clickable graphs (static images only)
- Client-side rendering libraries (no D3.js, no Mermaid.js)
- Graph caching across builds (not needed)
- Full graph of all items (too large/cluttered; focus on per-item or filtered views)

## Decisions

### 1. GraphViz DOT for relationship graphs

**Decision**: Use GraphViz `dot` layout for per-item relationship graphs (1-hop, depth configurable).

**Rationale**: GraphViz produces clean hierarchical layouts for directed graphs. Kroki supports it natively. The DOT language is simple to generate from the graph data. Items become colored nodes by role; relationships become labeled edges.

### 2. Vega-Lite for coverage charts

**Decision**: Use Vega-Lite for bar charts showing per-role coverage counts.

**Rationale**: Vega-Lite is the simplest charting option supported by Kroki. A single JSON spec defines the chart; no JavaScript needed. For per-item coverage, show which relationship types are satisfied; for global, show counts by role.

### 3. Attribute gating, same pattern as links

**Decision**: Use `:traceability-graph:` as the opt-in attribute. Without it, `traceability:graph[]` and `traceability:graph-coverage[]` are stripped from output.

**Rationale**: Consistent with `:traceability-links:`. Graph generation is expensive (one Kroki call per item), so it must be explicitly enabled per document.

### 4. Single dashboard page, not inline graphs everywhere

**Decision**: Default example site usage is a single dashboard page. The inline macros work anywhere but are not enabled by default.

**Rationale**: 51 requirements × 2 macros = 102 Kroki calls on one page. A dashboard page with a global coverage chart plus select per-item graphs is more practical.

## Risks / Trade-offs

- **Kroki call volume**: Each graph is a separate Kroki HTTP call. → Mitigated by attribute gating (off by default).
- **GraphViz layout quality**: Auto-layout may produce suboptimal graphs for complex structures. → Acceptable for v1; manual tuning possible via DOT attributes.
- **Vega-Lite in PDF**: asciidoctor-kroki renders Vega-Lite as PNG in PDF. → Acceptable; coverage charts are supplementary.
