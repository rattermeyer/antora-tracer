## Why

`fix-supersession-link-orientation` (#20) changed `TraceabilityGraph.isOrphaned` to treat a functional link as "to" an item regardless of which endpoint the configured relation stores as its source. Its spec delta modified only the `traceable-item-supersession` capability, but two other capabilities depend on `isOrphaned` and still describe the old target-only semantics, so their specs now contradict the code:

- `cli-query` — "query orphaned — find superseded items with no **incoming** functional links".
- `item-lifecycle` — `remove`'s "orphaned (superseded, no incoming functional links)".

Proven: for a superseded requirement that is the stored *source* of a `verified_by` edge, the code returns `isOrphaned = false`, while the old wording implies `true`.

## What Changes

- `cli-query`'s orphaned requirement is restated in terms of the item's orphaned state rather than an incoming-only link, so the spec matches `isOrphaned`.
- `item-lifecycle`'s `remove` scenario uses the same wording.
- No code change: the implementation already has the corrected behaviour; only the specs are realigned.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities
- `cli-query`: the `query orphaned` requirement is renamed and restated without assuming the functional link targets the item.
- `item-lifecycle`: `remove`'s orphaned requirement and scenario use the same orientation-agnostic wording.
- `traceable-item-supersession`: the orphaned requirement is renamed to drop "incoming", since its body was already widened by `fix-supersession-link-orientation` but its heading still said "incoming functional links".

## Impact

- `openspec/specs/cli-query/spec.md` — one requirement renamed and restated.
- `openspec/specs/item-lifecycle/spec.md` — one requirement and scenario reworded.
- `openspec/specs/traceable-item-supersession/spec.md` — one requirement renamed.
- `examples/tracer/modules/requirements/pages/index.adoc` — REQ-227 and REQ-228 titles/body aligned to the renamed headings.
- No source, config, or API change.
