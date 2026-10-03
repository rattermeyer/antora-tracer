## Context

`TraceabilityGraph` already maintains two relation indexes: `_relationshipIndex` (fromId -> type -> relationships) and `_reverseRelationshipIndex` (targetId -> type -> relationships) (`src/TraceabilityGraph.ts`).
Every relation declares a `reverse` type in the preset, and complementary pairs are stored as one canonical edge (see `bidirectional-relationship-merge`), so undirected traversal requires no new state — only reads that consult both indexes.
The CLI already has a `query` command with subcommands (`reverse`, `impact`, `isolated`, `path`) that parse source files without an Antora build; a new subcommand slots into the same pattern.

## Goals / Non-Goals

**Goals:**
- Sibling discovery as a pure read over existing indexes — no graph-state changes
- One sibling concept (undirected over typed edges), parameterized by optional relation type
- Review-ready output: shared-neighbor context and supersession status per sibling

**Non-Goals:**
- Split siblings via `supersedes` chains (separate future feature; `getSuccessors` already covers the direct case)
- Rendering macros or automatic link sections for siblings (CLI query first; renderer integration would be its own change)
- New validation rules based on sibling structure

## Decisions

**Undirected neighbor collection.**
Neighbors of X = targets of X's outgoing edges (forward index) + sources of X's incoming edges (reverse index).
Sibling Y must share at least one neighbor Z, connected via the same relation type on both sides (X—Z and Y—Z).
Alternative considered: direct edge-symmetric query (X and Y both point at each other's targets) — rejected; it loses the shared-source case (REQ-087 and REQ-088 are siblings because PRQ-002 validates both).

**Relation-type filter semantics.**
`getSiblings(itemId, relationType?)`: when a type is given, only edges of that type (in either direction) contribute neighbors; when omitted, all types contribute.
The filter applies to the X—Z edge and the Y—Z edge independently — both must use the filtered type.
This matches the review question "who else validates what I validate" without mixing `verifies` into the answer.

**Result shape: `Array<{ siblingId, sharedTargets: string[], superseded: boolean, successorIds?: string[] }>` sorted by siblingId.**
The graph method returns IDs plus supersession-derived fields; the CLI decorates with role/title via `getItem`.
Shared-neighbor IDs are the payload's reason-for-being: a bare sibling list loses review context.
Alternative considered: returning full `Item` objects — rejected; the query's contract is about connections, not item payloads, and supersession fields would be re-derived per call site.

**Supersession status via existing APIs.**
`isSuperseded(siblingId)` and `getSuccessors(siblingId)` already exist; the sibling query composes them rather than adding new supersession state.

**CLI subcommand shape.**
`query siblings <id> [--relation <type>] [--input <dir>] [--format <table|json>]`, following the existing `query reverse` conventions for input handling, unknown-ID warning with exit code 1, and empty results with exit code 0.
Table output groups rows by sibling: one row per (sibling, shared-neighbor pair) or a comma-joined shared list per sibling — decided at implementation time to match the existing query table style.

## Risks / Trade-offs

- [Query cost is O(deg(X) * avg-deg(neighbors))] → bounded by graph degree; fine for docs-scale graphs. No caching planned; revisit only if a real project reports slowness.
- [Sibling explosion on hubs] → an item related to a hub (a matrix column everyone points at) can return many siblings. Mitigation: relation-type filter, and CLI output lists shared neighbors so the user can see why each sibling appears.
- [Two-sided relation filter may surprise] → filtering by `validates` excludes siblings sharing the neighbor via `verifies` by design. Mitigation: documented in the CLI help; scenario in the spec pins the behavior.
