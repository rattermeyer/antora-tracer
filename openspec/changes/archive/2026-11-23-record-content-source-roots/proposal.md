## Why

A harvested item records a source file that cannot be resolved back to a file on disk.

`Item.sourceFile` is component-root-relative — `modules/requirements/pages/index.adoc` — and no field
records what that path is relative to. `HarvestedFile` carries the same relative path
(`src/SiteGraph.ts:60-71`) and only gains an absolute path when the CLI resolves it against its
`--input` argument (`resolveSourceFilePath`, `src/cli.ts:240-252`).

This is sufficient for a single-source checkout and insufficient everywhere else:

- The project's own self-traceability playbook declares **three** local content sources
  (`antora-playbook.yml:6-14`: `examples/tracer`, `examples/demo`, `blog`), and the CI playbook pulls
  **ten versions** of `tracer`. Measured: a harvest of `antora-playbook.yml` yields 408 items across
  components `tracer` and `demo`, all with a `sourceFile` but no root.
- `modules/ROOT/pages/index.adoc` therefore does not identify one file. A consumer that resolves it
  against the wrong root reads the wrong document, and an editor that writes to it edits the wrong
  document.
- Duplicate IDs across those sources are routine, so the ambiguity is not hypothetical: the
  feasibility study found `REQ-001` defined twice in one example page alone.

Any surface that navigates to an item, previews the page it lives in, or writes it back needs the
root. The data already exists in the harvest and is discarded before the item is built.

## What Changes

- Record each harvested file's content-source root, resolved from the Antora origin metadata, on the
  harvested file.
- Carry the root onto the items built from that file, alongside the existing `component`, `module`,
  and `version` scope.
- Resolve the root without recording a build-machine absolute path in the published graph, so the
  published `graph.json` payload and the snapshot format keep their current shape.

## Capabilities

### New Capabilities
- `content-source-roots`: harvested items identify the content-source root their relative source path
  belongs to, so an item resolves to exactly one file.

### Modified Capabilities
- `multi-source-diff`: the requirement "Harvested items carry component, module, and version scope"
  is widened to include the source root, since the same relative path in two sources is the case
  that requirement exists to disambiguate.

## Impact

- `src/SiteGraph.ts` — `HarvestedFile` gains the root; `harvestSiteFiles` reads it from the file's
  origin.
- `src/index.ts` — the item-building path passes the root through.
- `src/types.ts` — `Item` gains one optional field.
- `src/GraphSnapshot.ts` — verified in design: the snapshot must not start publishing absolute build
  paths. The field is excluded from serialization the same way `pubUrl` already is
  (`src/GraphSnapshot.ts:30-32`).
- `src/cli.ts` — `resolveSourceFilePath` can use the recorded root instead of always assuming
  `--input` is the root.
- No new dependency; no config change.
