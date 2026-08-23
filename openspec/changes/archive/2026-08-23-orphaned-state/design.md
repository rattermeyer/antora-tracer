## Context

`traceable-item-supersession` already derives an item's superseded state from incoming `supersedes` links and omits superseded items from current matrices. The lifecycle now needs a second derived state: "superseded, and nothing functional points at it anymore" — the signal that a superseded item is safe to archive or remove.

Today that state has no name, and "orphaned" is overloaded across the CLI (`query orphaned` = zero relationships) and validation ("orphaned relationship" = link with a missing endpoint).

## Goals / Non-Goals

**Goals:**
- One word per concept: `isolated` (zero relationships), `orphaned` (superseded + no incoming functional links), `dangling reference` (link → missing target).
- A graph query `isOrphaned(id)` usable by the later archive/remove commands and the overview page.

**Non-Goals:**
- No archive/remove CLI (see `archive-remove-cli`).
- No overview page or render toggle (see `supersession-overview`).
- No re-classification of dangling links between error and advisory (see `supersession-overview`).

## Decisions

1. **`isOrphaned(id)`** = `isSuperseded(id)` AND no incoming relationship whose type is outside `HISTORY_RELATION_TYPES`. Reuses the history/functional split already used by the `stale_link` warning.
2. **`query isolated`** replaces the old `query orphaned` (zero relationships) — a breaking rename, surfaced in the CLI help.
3. **`query orphaned`** takes the new meaning (superseded + no incoming functional links) and reports each item's direct successors.
4. **`dangling reference`** renames the `validate` "orphaned relationship" diagnostic, without changing error/warning classification in this change.

## Risks / Trade-offs

- [Breaking CLI rename] → `query orphaned` callers must switch to `query isolated`; acceptable at v0.x, noted in the changelog.
- [Vocabulary drift] → the three terms are defined once in `cli-query` / `cli-validate` specs and reused consistently in later changes.
