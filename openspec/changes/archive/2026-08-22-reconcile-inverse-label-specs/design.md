## Context

After `reverse-relations`, the incoming display pipeline is:

1. `TraceabilityGraph.getInverseType(type)` resolves the reverse type from the `reverse` declaration in `relations`.
2. `displayLabel(type)` renders `labels[type] ?? humanize(type)`.

The incoming macro groups relationships by `getInverseType(rel.type) ?? rel.type`, then labels the group with `displayLabel(groupKey)`. Display text therefore comes from the `inverse-labels` spec (`labels` + humanize), while the reverse pairing comes from the `reverse-relations` spec (`reverse`).

Two `incoming-links-macro` requirements still describe the pre-`reverse-relations` mechanism (compile-time `INVERSE_MAP`), and two other specs still mention `inverseLabels` in passing.

## Goals / Non-Goals

**Goals:**

- Make every spec body describe the current mechanism (declared `reverse` + `labels`/humanize).
- Remove requirements that are now wholly redundant with `inverse-labels` and `reverse-relations`.
- Keep the requirements index consistent with the edited specs.

**Non-Goals:**

- No code changes — behaviour is already shipped.
- No new capabilities.
- No changes to `inverse-labels` or `bidirectional-relationship-merge` (their "no `INVERSE_MAP` lookup" / "not by `inverseLabels`" wording is intentional and correct).

## Decisions

### D1: Rewrite the incoming-links-macro "Inverse relation type labels" requirement

The incoming macro still has a real behaviour — it groups by the reverse type name. The requirement stays but its mechanism changes from "built-in inverse label mapping" to "the declared `reverse` of the relation type". Title becomes "Incoming groups use the reverse relation type" for accuracy.

### D2: Remove "Fallback to raw type name when no inverse mapping exists"

This fallback is now the humanize default, already specified in `inverse-labels` ("Default display name is the humanized type" and "No compile-time fallback"). The requirement and its scenarios are removed. The corresponding index item REQ-147 is removed; REQ-067 is kept with a corrected body.

### D3: Fix `preset-inheritance` wording

"inverse labels" / `inverseLabels` → `labels` in the Purpose, the "Child overrides parent" scenario, and the "Merge semantics match config-file `extends`" requirement. Semantics unchanged — the merge still overrides display labels key-by-key.

### D4: Fix passing mentions in `traceability-links-macro` and `graph-visualization`

`traceability-links-macro` scenario: "render with inverse labels" → "render with reverse-type labels". `graph-visualization` scenario: replace the `inverseLabels` map with a `relations` `reverse` declaration.

## Risks / Trade-offs

[Index churn] → removing REQ-147 and rewording REQ-067 means the next `update-example-site` run would flag them again if the spec edit is not applied together. Mitigation: this change's tasks update both the specs and the index in one pass.

[Rewording is editorial] → the four spec edits are prose-level; no behaviour is asserted by tests. Mitigation: low risk, but the edits must keep each spec parseable and internally consistent.
