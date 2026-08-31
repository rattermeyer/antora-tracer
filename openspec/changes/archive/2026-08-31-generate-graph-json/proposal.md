## Why

The extension already publishes per-version matrices, overview, and coverage pages, but no machine-readable form of the traceability graph itself. Diffing two published versions today requires checking out both source trees and re-parsing them (CLI `diff`), or running a separate CLI harvest (`site-graph`, proposed in `multi-source-diff`). Emitting the graph as JSON alongside the matrices makes the published site self-describing and gives snapshot diffing a per-version artifact to consume.

## What Changes

- The extension serializes each version's traceability graph to a JSON snapshot and registers it as a site attachment under `traceability/graph.json`, per component version — the same mechanism matrices already use.
- The snapshot reuses the canonical format proposed by `multi-source-diff`: `{ format: 1, component, version, items, relationships }`, where each item carries `id`, `role`, `title`, `content`, `status`, `attributes`, `component`, `module`, `version`, `sourceFile`, `sourceLine`. `pubUrl` is deliberately excluded (it embeds the version segment and would make the diff noisy).
- The graph JSON is gated by the existing `generateMatrices` option — no new config flag. It is emitted wherever matrices are.
- Items gain an optional `version` field so the snapshot carries version scope on each item (shared with `multi-source-diff`).

## Capabilities

### New Capabilities

- `graph-json-attachment`: The extension SHALL generate a per-version graph JSON snapshot and register it as a site attachment alongside the generated matrices.

### Modified Capabilities

<!-- none -->

## Impact

- **Antora extension**: `src/antora-extension.ts` — serialize the per-version graph in the `contentClassified` loop (the only point where version boundaries still exist) and register it via the existing `registerAttachmentInCatalog` helper.
- **Types**: `src/types.ts` — add optional `version` to `Item`.
- **Snapshot format**: reuse the `{ format, items, relationships }` shape from `multi-source-diff`; this change and `multi-source-diff` must agree on the serializer so `diff-graphs` can consume extension-emitted snapshots.
- **Tests**: `test/*.test.ts` — snapshot content, per-version registration, unversioned components, no-pubUrl guarantee.
- **Docs**: `reference/configuration.adoc` (mention graph JSON under matrix generation) and `how-to/visualizations.adoc` / `how-to/contribute.adoc` as applicable.

## Relationship to `multi-source-diff`

`multi-source-diff` proposes the same canonical snapshot format, a CLI harvest (`site-graph`), and a snapshot diff (`diff-graphs`). This change is the extension-side producer: it emits the same artifact during a normal Antora build so a published version carries its own snapshot. The two changes share the serializer and the `version` field on `Item`; the CLI diff consumer lives in `multi-source-diff`.
