## Context

`TraceabilityGraph.addRelationship()` canonicalizes a reverse-authored edge only when both endpoints are resolved.

With scoped identities, an edge parsed before its target exists can initially have a different key from the reverse edge parsed after both items exist.

`canonicalizeRelationships()` later rebuilds the graph and makes both edges share one canonical key.

The reverse-authored record already carries `bidirectional: true`, but the duplicate branch currently checks only whether the current insertion was flipped during that call.

## Goals / Non-Goals

**Goals:**

- Merge a deferred reverse-authored edge with its canonical counterpart without reporting a duplicate.
- Retain one canonical edge and its bidirectional metadata.
- Keep genuine repeated primary declarations reportable as duplicates.

**Non-Goals:**

- Change endpoint resolution, identity construction, relation configuration, or warning classification.
- Change the public relationship API or add dependencies.

## Decisions

- Treat `relationship.bidirectional` as inverse-pair provenance alongside the current call's `wasReverse` result.
- On a canonical-key collision with either signal, mark the stored edge bidirectional and retain the incoming relationship ID as `inverseOf`.
- Keep deferred endpoint resolution unchanged; assigning provisional scoped identities could be incorrect when the target belongs to another component.

## Risks / Trade-offs

- A caller that manually marks an unrelated relationship bidirectional can suppress a duplicate warning for that edge → Preserve the existing meaning of `bidirectional` as graph merge metadata and cover real primary duplicates with existing tests.

## Migration Plan

No migration is required; this changes only in-memory graph reconciliation.

## Open Questions

None.
