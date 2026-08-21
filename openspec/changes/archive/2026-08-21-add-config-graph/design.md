## Context

The extension already renders two kinds of diagram through Kroki, both gated by the `:traceability-graph:` document attribute and both expanded in `antora-extension.ts` via `krokiUrl(type, source)`:

- `traceability:graph[]` — `TraceabilityGraph.toDot(itemId, depth)`, a per-item relationship subgraph (GraphViz).
- `traceability:graph-coverage[]` — `TraceabilityGraph.toVegaLite(itemId?)`, coverage bar charts (Vega-Lite).

Neither renders the *configuration* — the role model and the allowed relations between roles. That model lives in `ConfigLoader.getConfig()`, which returns the **merged** `CompleteConfig` (preset plus `extends` overrides): `roles: string[]` and `relations: Record<role, Record<role, string[]>>`, plus an `inverseLabels` map used only for traversal/display, not for structure.

The project's own model (`examples/traceability.yml` extending `requirements-engineering`) has 8 roles and 19 declared edges. Nothing on the example site shows it.

## Goals / Non-Goals

**Goals:**

- A `traceability:config-graph[]` macro that renders the merged configuration as a Kroki GraphViz diagram: roles as nodes, declared relations as labeled edges.
- Declared directions only — render `relations` as-is; ignore `inverseLabels`.
- Reuse the existing Kroki GraphViz pipeline and the `:traceability-graph:` gate.
- A reader-facing Explanation page (`our-traceability-model.adoc`) pairing the generated graph with hand-written meanings of this project's roles and relations.

**Non-Goals:**

- No rendering of `inverseLabels` or derived reverse edges.
- No machine-readable role/relation descriptions in the config schema — meanings stay prose.
- No item/data graph rendering (that is the existing `traceability:graph[]`).
- No CLI command in this change. Debugging is an incidental benefit (orphaned roles become visible), not a new CLI surface.

## Decisions

### D1: `toConfigDot(config)` as a pure function on the config module

The generator is an exported function `toConfigDot(config: CompleteConfig): string` in `src/config/TraceabilityConfig.ts`.
It is pure (no file I/O) so it is unit-testable without loading a config file.

Alternatives considered:
- A method on `TraceabilityGraph` — rejected: it operates on config, not graph data, and would mix concerns.
- A new `ConfigGraph.ts` module — rejected: one function does not justify a new file.

The macro expansion calls `this.traceability.getConfig()` and passes the result to `toConfigDot`, mirroring how the existing macros call `this.traceability.graph.toDot()`.

### D2: Declared directions only

The DOT renders `config.relations` exactly as declared. `inverseLabels` is never read by the generator.
Rationale: the `relations` block encodes the author's intent (active voice); derived inverse edges would double the edge count and hide the model's shape.
The `use_case ↔ requirement` pair (`leads_to` / `is_derived_from`) renders as two declared edges because both directions are literally declared — the generator is faithful, not editorializing.

### D3: Nodes derived from `roles`, not from `relations`

The generator iterates `config.roles` for nodes, so a role declared but wired to nothing still renders as an isolated node.
This is the whole debugging payoff: an orphaned role (e.g., `constraint` today) becomes visible instead of silently absent.
Edges are then drawn from `config.relations`.

### D4: Shared role palette

The existing `TraceabilityGraph.ROLE_COLORS` (currently a private static) is extracted to a shared exported constant so the data graph and config graph render identical role colors.
The home is chosen to avoid a runtime import cycle: the config module must not import the graph module at runtime (the graph's import of config is type-only).

### D5: Macro scope and gating

`traceability:config-graph[]` is a **global** macro (valid outside item blocks, like the global `traceability:graph-coverage[]` case) because the model is whole-document, not per-item.
It is gated by the same `:traceability-graph:` attribute; when the attribute is absent, or when no config is loaded, the macro is stripped from output — never throws.

## Risks / Trade-offs

[Dense models] → 19 edges on 8 roles is already busy; larger user configs will be unreadable.
Mitigation: this page documents the project's own (small) model. A role-subset filter is future work if users want their own models rendered.

[Color drift] → data graph and config graph must agree on role colors.
Mitigation: D4 — single shared palette constant.

[No config loaded] → `getConfig()` throws when a loader exists but nothing was loaded.
Mitigation: the macro expansion guards on config presence and strips rather than throws, matching the existing `if (!this.traceability) return` pattern.

[Self-loop clutter] → `requirement→requirement`, `design→design`, `implementation→implementation` add three loops.
Mitigation: keep them (they are meaningful — intra-role relations are legal and used). A toggle is a possible follow-up.

## Open Questions

- Should self-loops be suppressed or demoted to a footnote? Lean: keep them; the prose explains them.
- Should a CLI `config graph` command be added later for author-side debugging? Deferred — not needed for the reader-facing goal.
