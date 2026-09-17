## Context

The id-server consumes a `prefixes` map with a numeric `start` per prefix (see the archived `id-allocation-server` change). The client already computes `max+1` for a single prefix (`TraceabilityGraph.getNextId`, returning a formatted `PREFIX-NNN` string), and the CLI already harvests the full cross-source graph from a playbook (`harvestSiteFiles`, used by `site-graph`). See proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Emit a seed file the id-server can consume directly.
- Support both a local directory and a multi-repo playbook.
- Report numeric `max+1` per prefix, never the current max and never a formatted ID string.

**Non-Goals:**
- Per-tenant seeds (the server's `start` is per-prefix, not per-tenant).
- Fixing pre-existing ID collisions across repos — the seed only prevents *new* collisions.
- Auto-refreshing the seed on every build — it is a one-shot migration helper.

## Decisions

### 1. Standalone CLI, not the Antora extension
The `seed` command lives in the CLI. Rationale: seeding is a one-time operational step, and a build artifact that regenerates each build could overwrite live server counters with stale values. The CLI already does multi-repo harvesting without a build via `harvestSiteFiles`.
Alternative: emit `seeds.yml` as an Antora build output — rejected for the stale-overwrite hazard and the wrong dependency direction.

### 2. Two input modes
`seed -i <dir>` scans one directory (same collection path as `next-id`); `seed <playbook>` calls `harvestSiteFiles` for the full cross-source graph.
Rationale: covers both the simple and distributed cases with the machinery already present.

### 3. `getPrefixMaxima()` returns numbers, not strings
A new `TraceabilityGraph.getPrefixMaxima()` iterates `_items.keys()`, splits each ID on the trailing `-\d+`, and returns `Map<prefix, { start: number; width: number }>` where `start` is `max+1`. `getNextId` is not reused because it formats `PREFIX-NNN` strings, which is wrong for a seed.
Rationale: the seed value is a number the server increments from; a formatted string would need re-parsing and could mask the off-by-one.

### 4. `start` is max+1, never max
Seeding with the current max would re-issue an in-use ID. The seed is the *next* number.
Rationale: this is the core correctness property — the allocator's first allocation must not collide with an existing ID.

### 5. Version deduplication in playbook mode
Harvested items carry component/module/version scope; the same item ID appears once per version. The reduction keys on the item ID, not the `(component, version)` tuple, so each item contributes once to the max.
Rationale: the seed is a global number across the shared namespace, not a per-version number.

### 6. Output shape mirrors the id-server config
The seed file is a `prefixes:` map with `start` (and `width` when inferred), so it can be pasted into or merged with the server's config unchanged.
Rationale: drop-in consumption; no translation layer.

### 7. Width is a bonus, not a requirement
`getPrefixMaxima()` also captures the inferred padding width (the longest existing suffix length), emitted as `width`. The id-server defaults width to 3 when absent, so omitting it is safe.
Rationale: matching local padding conventions is nice-to-have; the server's own default is the fallback.

## Risks / Trade-offs

- [Stale seed] authors add items after export → the seed is a point-in-time snapshot; re-export. Mitigation: document as one-shot.
- [Pre-existing overlap] two repos already share IDs → the seed does not detect or fix that; merge-time duplicate detection remains the backstop.
- [Default-tenant only] the seed is per-prefix, not per-tenant → documented limitation; per-tenant seeds are the later management-CLI path.

## Migration Plan

New CLI command — no migration of existing data. Deploy by running `seed` once before pointing clients at the server. Rollback: delete the generated seed file; the server defaults to `start: 1`.

## Open Questions

None.
