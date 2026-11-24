## Context

See proposal.md — Why. `TraceabilityGraph.isOrphaned` is the single source of truth for "orphaned", used by `query orphaned` and `remove`. `fix-supersession-link-orientation` widened it to check both endpoints but restated only the `traceable-item-supersession` capability.

## Goals / Non-Goals

**Goals:** Every spec that describes orphaned state matches the one implementation.

**Non-Goals:** Changing the implementation (it is already correct); re-stating the `traceable-item-supersession` requirement (already synced by #20).

## Decisions

**Decision 1 — restate the dependent requirements in terms of orphaned state, not link direction.**

Rather than repeat the two-endpoint rule in each capability, `cli-query`'s requirement states the orphaned condition once (no functional relationship involves the item at either endpoint) and `item-lifecycle`'s scenario uses the same phrase. This keeps one definition of orphaned and lets each capability describe its own command.

*Alternative rejected*: leave the dependent specs and rely on `traceable-item-supersession` as the definition. That leaves two specs stating a rule the code does not follow, which is what this change exists to fix.

## Risks / Trade-offs

- **Spec text drift recurring** → The wording now names the endpoint-agnostic condition explicitly, so a future change to `isOrphaned` has an obvious place to update.
