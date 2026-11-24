## Context

See proposal.md — Why. A relationship is stored canonically: when a test authors `verifies:REQ-042[]`, the graph stores `REQ-042 → TST-008 : verified_by` (the primary direction), so the superseded requirement is the edge's **source**. Three checks inspect only `rel.targetIdentity`/`getReverseRelationships(id)` — the target side — so they never see it.

## Goals / Non-Goals

**Goals:** A functional link involving a superseded item is reported and counted regardless of which endpoint the relation stores as its source.

**Non-Goals:** Changing how relationships are stored or canonicalized; changing which definition wins; changing the message for target-side links beyond what the widened logic requires.

## Decisions

**Decision 1 — one graph helper, "functional links involving an item", used by all three consumers.**

`getFunctionalLinksInvolving(itemId)` returns non-history relationships whose stored source or target is the item. `isOrphaned`, the `stale_link` loop, and the CLI's `supersession check` worklist all route through the same orientation-agnostic notion, so the three cannot drift apart again. This mirrors the existing `getReverseRelationships` index but adds the source side by scanning stored relationships — the relationship count is bounded by the graph and this path is not hot.

*Alternative rejected*: build a second reverse index keyed on the source. More state to keep consistent for no measured benefit at these sizes.

**Decision 2 — the warning names the item that still points at the superseded one.**

For a target-side link that is the relationship's source (as before); for a source-side link it is the relationship's target. The message reads "Relation '<type>' between '<other>' and '<superseded>' requires review: '<superseded>' is superseded by <successors>." Existing target-side tests assert the successor id appears and `supersedes` is absent, both of which still hold.

## Risks / Trade-offs

- **Widening `isOrphaned` could make `remove` refuse on items it used to delete** → Intended: an item with a live functional link is not orphaned, which is what `remove`'s guard is for. The existing orphaned tests still pass.
- **Duplicate warnings for a link that is both source- and target-side** → Impossible: a relationship has one stored source and one stored target.
