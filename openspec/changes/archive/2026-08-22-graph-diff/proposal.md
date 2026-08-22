## Why

Traceability deltas (what changed between two releases of a documentation set) are today hand-written or absent, and hand-written deltas drift from reality. Antora already isolates the graph per component version and items carry stable IDs, so the delta between two snapshots is derivable — and a derived delta is truthful by construction.

This must work for any user of the `antora-tracer` package, not only this repository: it is a public, config-agnostic capability.

## What Changes

- **`diffGraphs(old, new)` public API** — a pure function that compares two `TraceabilityGraph` instances and returns a `GraphDiff` of item-level and relationship-level changes. Exported from the package and documented in `reference/api.adoc`.
- **Read-only `diff` CLI command** — `antora-tracer diff --from <path> --to <path>` scans two sets of AsciiDoc sources (same machinery as `query`/`process`), builds two graphs, and prints the delta. `--json` emits machine-readable output. Never writes source files.
- **Identity-first, config-agnostic delta** — items are matched by stable ID, so the diff works with any role/relation vocabulary a user has configured. No preset assumptions.
- **Field-level `modified`** — a surviving item is `modified` when `title`, `content`, `role`, `status`, or `attributes` differ; the delta reports which fields changed.
- **Derived relationship delta** — relationship changes are reported only for items that survive the diff, avoiding noise from removed items' dangling links.
- **Supersession as added + removed** — a superseded item appears as `removed` and its successor as `added`, with the `supersedes` relationship listed as a new relationship. No rename heuristic is required for the controlled-environment workflow.

## Capabilities

### New Capabilities

- `graph-diff`: derive an item-level and relationship-level delta between two graph snapshots by stable ID, and expose it as a public API and a read-only CLI command.

### Modified Capabilities

<!-- none -->

## Impact

- `src/GraphDiff.ts` — new `diffGraphs` function and `GraphDiff` / `ItemDelta` / `RelationshipDelta` types.
- `src/index.ts` — export the new public API.
- `src/cli.ts` — new `diff` command (reuses `collectAdocFiles` + `processFiles`).
- `src/types.ts` — `ItemDelta` / `RelationshipDelta` / `GraphDiff` types (or colocate in `GraphDiff.ts`).
- `reference/api.adoc`, `reference/cli.adoc`, a `how-to/diff-versions.adoc` guide.
- Tests (`test/graph-diff.test.ts`).
- No new dependencies.

## Out of scope (deferred)

- Rename heuristics (matching a renumbered item by content similarity) — supersession makes renames explicit.
- The "change" wrapper (narrative + lifecycle) — a future companion package.
- Diffing git refs directly — `--from`/`--to` take filesystem paths; git-ref resolution is a follow-up.
