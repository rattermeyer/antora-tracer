## Context

The self-traceability example models three traceability layers: REQ (requirements), ARC (design concepts, `role=design`), and TST (tests). An ARC item declares the requirements it addresses with `addresses:REQ-NNN[]`, and the `requirements-to-design` matrix renders that coverage.

`architecture.adoc` currently has 27 ARC items (`ARC-001`…`ARC-034`). A diff of REQ items against `addresses:REQ-*` links shows 68 requirements without a design concept. This change closes the gap introduced by the recent `reverse-relations`, `matrix-status`, and `preset-inheritance` work, plus the pre-existing `REQ-129` merge concept.

## Goals / Non-Goals

**Goals:**

- Add a design concept for each recent feature area that has none.
- Link those ARC items to the exact REQ IDs they address.
- Make the "every requirement has a design concept" convention explicit in the spec.

**Non-Goals:**

- No code changes.
- No changes to the remaining ~32 design-free requirements (documentation/tooling/example-site meta).
- No fix for the pre-existing software-behaviour gaps (`REQ-111/112`, `REQ-116–119`, `REQ-136–143`, `REQ-146`, `REQ-150`) — tracked separately.

## Decisions

### D1: Four new ARC items

| ID | Title | Addresses |
|---|---|---|
| `ARC-035` | Relation reverse declaration and canonical storage | `REQ-129`, `REQ-175`, `REQ-176`, `REQ-177`, `REQ-178` |
| `ARC-036` | Preset inheritance and config merge | `REQ-170`, `REQ-171`, `REQ-172`, `REQ-173`, `REQ-174` |
| `ARC-037` | Display labels with humanize default | `REQ-161`, `REQ-162` |
| `ARC-038` | Matrix status column | `REQ-167`, `REQ-168`, `REQ-169` |

Rationale: one ARC item per feature area (reverse relations + the merge it rewired, preset inheritance, display labels, matrix status). The merge (`REQ-129`) is folded into `ARC-035` because `reverse-relations` changed its mechanism to canonicalize + dedupe; the two are one concept now.

### D2: Item bodies describe the current mechanism

Each ARC body states the as-is behaviour:
- `ARC-035` — keyed `relations` with mandatory `reverse`; authoring the reverse canonicalizes to the primary edge; `isRelationAllowed` derives the reverse direction; merge is canonicalize + dedupe driven by `reverse`.
- `ARC-036` — top-level `extends` on a preset; deep-merge of roles/relations/matrices/`labels`; transitive chains; missing-parent and cycle detection.
- `ARC-037` — `labels` map, display-only, `humanize(type)` sentence-case default.
- `ARC-038` — one per-row status column (`done`/`partial`/`missing`); coverage summary preserved; CSV unchanged.

### D3: Add a coverage-convention requirement to `doc-self-traceability`

A new requirement states every functional requirement SHALL be addressed by at least one design concept, so the completeness of the REQ→ARC coverage is itself a spec'd, checkable property of the example site.

### D4: Leave constraint-like requirements out

`REQ-163`–`REQ-166` (PDF compatibility, source-not-modified) are restatements of `CON-002`/`CON-003` and are already conceptually covered by `ARC-015`. No new ARC item is added for them.

## Risks / Trade-offs

[New ARC IDs] → `ARC-035…038` must not collide with existing IDs; they are the next free IDs (existing run ends at `ARC-034`).

[Coverage-convention requirement] → once spec'd, the example site must keep REQ→ARC coverage complete going forward; a future reconciliation would flag any drift. Mitigation: this is the point — turn the convention into a checkable invariant.
