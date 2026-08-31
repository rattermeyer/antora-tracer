## Context

The extension builds the traceability graph in the `contentClassified` handler, iterating one version at a time: it clears `this.traceability.graph`, processes that version's files, canonicalizes relationships, then merges into `this.fullGraph` (the all-versions accumulation used at `sitePublished`). Matrices are registered as attachments inside this per-version window via `registerMatricesInCatalog`; by `sitePublished` the version boundary is gone (`fullGraph` is merged).

Two consumers need a per-version graph artifact: (1) snapshot diffing (`diff-graphs`, proposed in `multi-source-diff`) wants a stored JSON per published version, and (2) external tooling wants the raw graph without re-parsing sources. The graph's `Item`/`ItemRelationship` are already plain-JSON-safe, so serialization is cheap. The `multi-source-diff` change defines the canonical snapshot format and the diff consumer; this change is the extension-side producer of that same format.

## Goals / Non-Goals

**Goals:**

- Emit a per-version graph JSON snapshot alongside the generated matrices during a normal Antora build.
- Register it as an attachment so it is published at a version-scoped URL and xref-able.
- Use the canonical snapshot format so `diff-graphs` can consume it directly.
- Keep the change additive and gated by the existing `generateMatrices` option.

**Non-Goals:**

- A CLI diff consumer (that is `multi-source-diff`).
- The CLI harvest path (`site-graph`) — this only covers the extension, not playbook aggregation outside a build.
- Rename detection or any change to `diffGraphs` semantics.
- Per-component splitting of a multi-component version — the snapshot is per version (the existing graph granularity).

## Decisions

1. **Capture in the per-version loop, not at `sitePublished`.** The loop is the only place where `version` is known and the graph is self-contained. Serialize `this.traceability.graph` right after `canonicalizeRelationships()` and before the `merge()` into `fullGraph`. By `sitePublished` versions are merged and per-version output is impossible. *Alternative:* serialize `fullGraph` at `sitePublished` — rejected, loses version scoping.

2. **Register as an attachment via `registerAttachmentInCatalog`.** This reuses the matrix registration path, giving a version-scoped published URL, xref-ability, and refresh-in-place of a committed copy. *Alternative:* `writeFileSync` at `sitePublished` — rejected, that path uses `fullGraph` and produces a single merged file with no version identity.

3. **Reuse the `multi-source-diff` snapshot format.** `{ format: 1, component, version, items, relationships }` with per-item scope fields and no `pubUrl`. Sharing the serializer guarantees the extension's `graph.json` is a drop-in input to `diff-graphs`. *Alternative:* a separate format — rejected, would need a second loader in the diff consumer.

4. **Add optional `version` to `Item`.** The extension's `process()` call currently passes `component`, `module`, and `pubUrl` but not `version`; the snapshot needs version scope per item for component+version-qualified diff identity. Populate it from `file.src?.version` in `processAsciiDocFile`. *Alternative:* version only at the snapshot top level — rejected, breaks identity alignment with `multi-source-diff` when snapshots are mixed.

5. **Exclude `pubUrl` from the snapshot.** `pubUrl` embeds the version segment (`/tracer/0.19/...`), so it differs between any two versions and is recomputable from `component`+`module`+`sourceFile`. It is not in the diff's compared fields, so dropping it loses nothing for diffing and keeps snapshots version-stable.

6. **Gate on `generateMatrices`, no new flag.** The graph JSON ships wherever matrices ship, with no additional config surface. *Alternative:* a dedicated `generateGraphJson` flag — rejected as speculative until a real site wants matrices without the graph.

## Risks / Trade-offs

- [Version spans multiple components] → the snapshot is per version, so a version hosting two components produces one merged `graph.json`; `multi-source-diff`'s component-qualified diff keeps same-ID items distinct. Acceptable per the agreed scope.
- [Snapshot drift] → the artifact reflects the moment of build, not live sources; same as matrices. Snapshots are release artifacts; rebuild to refresh.
- [Format coupling with `multi-source-diff`] → both changes define the same shape; if they land independently the serializer must be reconciled. Mitigation: the format is specified in this change's spec and `multi-source-diff`'s, with a shared `format: 1` marker.
- [Larger site output] → one extra JSON file per component version; negligible vs matrices/HTML.

## Migration Plan

Additive. No existing behavior changes: matrices, overview, and coverage output are untouched. Sites that set `generateMatrices: false` see no new file. Sites that already build will additionally publish `traceability/graph.json` per version after upgrade.

## Open Questions

None — scope (per version), registration mechanism, and snapshot format were resolved above and against `multi-source-diff`.
