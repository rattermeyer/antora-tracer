## Why

When a baselined traceable item is replaced, its downstream design, verification, and dependency links require review. Antora Tracer can already identify direct and transitive impact, but it has no supersession semantics and therefore cannot distinguish current items from historical items or identify links that still target a predecessor.

This change provides explicit, auditable supersession and impact-review support. It does **not** claim to enforce baseline immutability: detecting an in-place edit requires comparison with another version or recorded baseline, which is deferred.

## What Changes

- **Generic `supersedes` / `superseded_by` relation** — a new item points to one or more predecessors. Presets decide which same-role item pairs may use it.
- **Derived effective state** — an item is effectively superseded when one or more valid incoming `supersedes` relationships target it. No redundant `status=superseded` value is required.
- **Split and merge support** — multiple successors may supersede one predecessor, and one successor may supersede multiple predecessors. Self-supersession and cycles are invalid.
- **Current-state matrices** — superseded row and column items are omitted from matrices by default, while the historical items remain in the graph and source documentation.
- **Visible suspect links** — functional links to superseded items remain visible in relationship macros and are marked `review required`, naming all direct successors. They are never silently removed or repointed.
- **Read-only CLI support** — `antora-tracer supersession check <id>` reports successors and direct incoming functional links requiring review. An optional `--impact` flag also reports the transitive blast radius. The command never modifies source files.
- **Advisory validation** — functional relationships targeting superseded items generate warnings that name the source, predecessor, and successor(s). History relationships (`supersedes` / `superseded_by`) are excluded.
- **Requirements-writing guidance** — authors review every incoming link and explicitly decide whether to revise, supersede, repoint, or retain the related artifact.

## Capabilities

### New Capabilities

- `traceable-item-supersession`: traceable items may explicitly supersede predecessors; current matrices omit predecessors; stale functional links remain visible and are reported for review.

### Modified Capabilities

<!-- none -->

## Impact

- `src/presets/*.yml` — configure `supersedes` / `superseded_by` for applicable same-role pairs.
- `src/TraceabilityGraph.ts` — derive effective supersession, resolve zero-to-many successors, validate cycles, and distinguish history from functional relationships.
- `src/MatrixGenerator.ts` — omit effectively superseded rows and columns from current-state matrices.
- `src/antora-extension.ts` — retain and annotate links to superseded items; render predecessor blocks with successor links.
- `src/cli.ts` — add the read-only `supersession check` command and optional transitive impact report.
- `skills/requirements-writing/SKILL.md` — document supersession and downstream impact review.
- Tests and user documentation.
- No new dependencies.

## Out of Scope

- Detecting edits to items in released baselines (requires version comparison or recorded hashes).
- Cross-version references such as `REQ-042@v1`.
- Automatic source-file modification or automatic link repointing.
- Physical or generated archive pages for superseded items.
- Changelog generation.
- Blocking release-gate enforcement; warnings are advisory in this change.
