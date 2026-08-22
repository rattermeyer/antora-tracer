## Why

The same reversible relationship is declared in three places and drifts by hand:

1. `relations` lists both directions separately — `use_case → requirement: leads_to` *and* `requirement → use_case: is_derived_from`.
2. `inverseLabels` separately re-pairs them for graph merge and incoming display — `leads_to: is_derived_from`.
3. The compile-time `INVERSE_MAP` uses yet another naming convention (hyphenated passive labels like `leads-to → led-by`).

A reader cannot see at a glance that `leads_to` and `is_derived_from` are one edge seen from two sides. The drift is not hypothetical: `examples/traceability.yml` currently has matrices referencing relations (`validates`, `considered_by`) that no longer exist in `relations`, and its `relations:` block is malformed mid-edit.

## What Changes

- **Keyed relations with a mandatory `reverse:`** — `relations` becomes `source → target → relationType → { reverse }`, declaring each reversible edge once. **BREAKING** config schema change.
- **Canonical primary storage** — authoring the reverse name (`is_derived_from`) canonicalizes to the primary edge (`UC → REQ : leads_to`), so the edge is the same regardless of which side authors it.
- **Derived reverse allowance** — `isRelationAllowed` auto-allows the reverse direction; no separate `requirement → use_case` entry needed.
- **`inverseLabels` → `labels`, display-only** — repurposed to map a relation type to a human-readable name, defaulting to `humanize(type)` ("leads_to" → "Leads to"). Never affects the graph. **BREAKING**.
- **Delete compile-time `INVERSE_MAP` / `PRIMARY_MAP`** — the reverse pairing lives only in config. **BREAKING** (internal).
- **Matrix coverage matches the canonical primary type** — one `coverageRelations` entry covers both authoring styles (fixes a latent miss where a reverse-authored link was not counted).

## Capabilities

### New Capabilities

- `reverse-relations`: relations are declared keyed with a mandatory reverse; authoring the reverse name canonicalizes to the primary edge; the reverse direction is derived for validation; symmetric relations declare themselves as their own reverse.

### Modified Capabilities

- `bidirectional-relationship-merge`: merge detection is now driven by the declared `reverse` (config) instead of `inverseLabels` / `INVERSE_MAP`; reverse-authoring canonicalizes at add-time rather than fusing two stored edges.
- `inverse-labels`: repurposed from "inverse display label" to display-only `labels` with a `humanize()` default; the compile-time fallback is removed.

## Impact

- `src/types.ts` — delete `INVERSE_MAP`, `PRIMARY_MAP`, and helpers; `ItemRelationship`/relation-type handling.
- `src/config/TraceabilityConfig.ts` — keyed relations schema with `reverse`, `labels` type, validation (mandatory reverse, symmetric self-reverse), `isRelationAllowed` reverse derivation.
- `src/TraceabilityGraph.ts` — `_resolveInverseType` uses `reverse` config; `addRelationship` canonicalizes reverse authoring to the primary edge.
- `src/MatrixGenerator.ts` — verify coverage matching uses the canonical type (likely no change).
- `src/presets/*.yml` — migrate all four presets to the keyed+reverse shape.
- `examples/traceability.yml` — migrate and repair the current drift.
- Docs (`reference/configuration.adoc`, `reference/presets.adoc`, `reference/traceability-macros.adoc`, `how-to/custom-domain-model.adoc`) and tests.
- No new dependencies.
