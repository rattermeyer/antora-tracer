## Context

The extension already generates matrices and a dashboard at `sitePublished` (gated by `config.generateMatrices`, written to `config.outputDir`). Supersession is now in place (`traceable-item-supersession`), and the `orphaned-state` change gives us the vocabulary (`orphaned`, `isolated`, `dangling reference`). This change adds a generated overview of supersession health plus a display-only render toggle.

## Goals / Non-Goals

**Goals:**
- A single generated view: totals, per-role breakdown, and a dangling-reference worklist.
- A display-only toggle that hides superseded items and their links without affecting the graph or matrices.
- Dangling history links are advisory (worklist), not build-failing errors.

**Non-Goals:**
- No archive/remove CLI (see `archive-remove-cli`).
- No source-file mutation.

## Decisions

1. **Generation rides the existing `sitePublished` path** — same hook that writes matrices and `index.html`, reusing `MatrixGenerator`-style counting from the in-memory graph.
2. **`renderSuperseded` is display-only** — the graph still contains superseded items (needed for link resolution); matrices already exclude them via `getCurrentItemsByRole`. The toggle only gates rendering.
3. **Dangling classification** — a dangling link whose type is in `HISTORY_RELATION_TYPES` is advisory; any other dangling link stays an error. Mirrors the existing `stale_link` history/functional split.
4. **The worklist shows source as xref** — the source item still exists (only the target is missing), so it can be xref'd directly to the block carrying the stale link.

## Risks / Trade-offs

- [Generating a real content page vs. an output file] → A true `component:module:page` content page can't be inserted into the content catalog after classification. Fallback: write to the output dir and link it from the dashboard `index.html`, mirroring the matrix files. See Open Questions.
- [Render toggle hides useful history] → default is `true` (render superseded); opt-in to hide.

## Open Questions

- Page vs. file: does the overview need to be a navigable content page (nav entry, xref-able) or is a dashboard-linked file acceptable? The former requires generating before content classification, not at `sitePublished`.
