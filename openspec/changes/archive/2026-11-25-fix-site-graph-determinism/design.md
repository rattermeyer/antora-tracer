## Context

See proposal.md - Why. ADR-015 already establishes the two-phase pattern: a
collection-boundary `canonicalizeRelationships()` after all files are read,
because the add-time flip requires both endpoints to exist. The `neo4j` command
and the extension's Antora path follow it; `site-graph` and `seed` did not.

## Goals / Non-Goals

**Goals:**
- One code path for "harvest a playbook into a graph", used by every command
  that does it, so the canonicalization boundary cannot be forgotten again.
- Snapshots that are byte-stable for an unchanged tree.

**Non-Goals:**
- Changing the snapshot schema or the `diff-graphs` comparison (already
  key-based and order-insensitive for set differences).
- Reordering the graph's internal maps; only the harvest order is made stable.

## Decisions

**Sort in `harvestSiteFiles`, not in the serializer.** The serializer receives a
graph whose edges are already recorded; sorting its output would fix the
symptom (byte-stability) but not the direction flip, which is decided at
`addRelationship` time. Sorting the harvest input makes ingestion itself
deterministic, so the same order produces the same canonicalization outcome.

**Put `harvestIntoGraph` in the library next to `harvestSiteFiles`, not in
`cli.ts`.** The regression test must exercise the real path; a CLI-local helper
would force the test to re-implement the loop and could pass while the command
stays broken. The helper takes a structural `HarvestTarget` (the two members it
uses) so `SiteGraph.ts` does not import the extension class.

**Keep `canonicalizeRelationships` idempotent and run it once per harvest.**
ADR-015 already makes it idempotent; running it at the single collection
boundary is O(E) once, not per file.

## Risks / Trade-offs

- [Sorting changes the ingestion order, so a snapshot from before this change
  differs from one after] → Expected: the pre-change snapshots were not stable
  anyway, and `diff-graphs` compares by key, not order.
- [A consumer relying on `findBy` order] → None in-tree; the order was never
  contractual and was unstable.
- [Canonicalization re-emits pending warnings] → `validate()` already filters
  stale pending warnings (ADR-015); the full suite stays green.
