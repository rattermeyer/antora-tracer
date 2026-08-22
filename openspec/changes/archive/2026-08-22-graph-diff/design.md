## Context

Antora Tracer already isolates the traceability graph per component version (`per-version graph isolation`) and gives every item a stable ID. The graph exposes `getAllItems()` and `getAllRelationships()`, and the CLI already scans raw `.adoc` files without Antora (`collectAdocFiles` + `processFiles`, used by `query`/`process`/`validate`). Diffing two snapshots is therefore mostly a matter of set operations over item IDs plus a field comparator — no new graph primitives.

The feature must be usable by any downstream user of the npm package, so it is a public API and CLI, config-agnostic, and documented in the user-facing Reference and How-to pages.

## Goals / Non-Goals

**Goals:**

- Compare two `TraceabilityGraph` instances and classify each item as added, removed, or modified.
- Report field-level modification for surviving items.
- Report relationship deltas only for surviving items.
- Expose the diff as an exported function and a read-only CLI command.
- Remain independent of any specific preset or role vocabulary.

**Non-Goals:**

- Rename detection by content similarity.
- The change lifecycle / narrative wrapper.
- Git-ref resolution.
- Writing any source file.

## Decisions

### D1: Identity-first diff

Items are matched by `id`. `added = ids(new) − ids(old)`, `removed = ids(old) − ids(new)`, and the intersection is inspected field-by-field for `modified`. Rationale: IDs are already stable and the supersession feature relies on the same invariant. This also makes the diff config-agnostic — no role names are hardcoded.

### D2: Field-level `modified`

A surviving item is `modified` when any of `title`, `content`, `role`, `status`, or `attributes` differs. The delta records the list of changed field names. `content` (the requirement statement) is the headline semantic signal; the others ride along rather than being ranked.

### D3: Relationships are a derived view

Relationship deltas are reported only when the source item survives the diff. A removed relationship is reported when both endpoints survive (a surviving item lost a link); a link that vanished because its target was removed is implied by the target's `removed` status. A new relationship on a surviving source is reported; new relationships on a newly added item are not, except history links.

### D4: Supersession appears as added + removed

No rename heuristic. When an item is superseded, the predecessor is `removed`, the successor is `added`, and the `supersedes` relationship is reported as a new relationship even though its source (the successor) is newly added and its target (the predecessor) is removed. History relations are the one exception to the surviving-source rule.

### D5: Public API + read-only CLI

`diffGraphs(old: TraceabilityGraph, new: TraceabilityGraph): GraphDiff` is exported from the package. The `diff` CLI scans two paths via the existing `collectAdocFiles`/`processFiles` helpers, prints a human table by default and JSON with `--json`, and never writes source files.

### D6: Types live with the function

`GraphDiff`, `ItemDelta`, and `RelationshipDelta` are defined in `src/GraphDiff.ts` and re-exported from `src/index.ts`, keeping the public surface in one module rather than growing `types.ts`.

## Risks / Trade-offs

[Content not always present] → `content` is optional on `Item`; some paths may not store it. Mitigation: a missing `content` is treated as "no change" for that field rather than an error.

[Cross-version ID collisions] → if a user reuses the same ID across versions for a semantically different item, the diff reports it as `modified`. Mitigation: this is the documented contract; supersession is the supported way to express replacement.

[Relationships can be large] → the relationship delta may be noisy for heavily-linked models. Mitigation: D3 already filters to surviving items; a future `--items-only` flag can suppress relationship output entirely.
