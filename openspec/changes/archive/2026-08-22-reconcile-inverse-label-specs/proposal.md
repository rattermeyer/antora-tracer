## Why

The `reverse-relations` change replaced `inverseLabels` with display-only `labels` and deleted the compile-time `INVERSE_MAP`/`PRIMARY_MAP`. Four specs still reference the old mechanism in their requirement bodies, so the source of truth no longer matches the implemented behaviour:

- `incoming-links-macro` — "Inverse relation type labels" (uses the removed "built-in inverse label mapping") and "Fallback to raw type name when no inverse mapping exists" (references `INVERSE_MAP`).
- `preset-inheritance` — Purpose and merge-semantics still say "inverse labels" / `inverseLabels`.
- `traceability-links-macro` — a scenario says incoming groups "render with inverse labels".
- `graph-visualization` — a scenario says `inverseLabels` maps `addresses` → `addressed-by`.

The requirements index mirrors this staleness: REQ-067 and REQ-147 trace to the two stale `incoming-links-macro` requirements.

## What Changes

- **`incoming-links-macro`** — rewrite "Inverse relation type labels" to say incoming groups use the declared `reverse` relation type; remove "Fallback to raw type name when no inverse mapping exists" (now covered by the `inverse-labels` spec's `labels` + humanize default).
- **`preset-inheritance`** — replace "inverse labels"/`inverseLabels` with `labels` in the Purpose, the child-overrides scenario, and the merge-semantics requirement.
- **`traceability-links-macro`** — update the scenario wording from "inverse labels" to "reverse-type labels".
- **`graph-visualization`** — update the scenario to use the `reverse` declaration instead of `inverseLabels`.
- **Requirements index** — remove REQ-147 (its requirement is removed); keep REQ-067 with a corrected body matching the rewritten requirement.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `incoming-links-macro`: one requirement rewritten, one removed.
- `preset-inheritance`: wording `inverseLabels` → `labels`.
- `traceability-links-macro`: scenario wording updated.
- `graph-visualization`: scenario updated to use `reverse`.

## Impact

- `openspec/specs/incoming-links-macro/spec.md`, `preset-inheritance/spec.md`, `traceability-links-macro/spec.md`, `graph-visualization/spec.md`.
- `examples/tracer/modules/requirements/pages/index.adoc` — REQ-067 body, REQ-147 removal.
- No code changes; these specs describe already-shipped behaviour.
