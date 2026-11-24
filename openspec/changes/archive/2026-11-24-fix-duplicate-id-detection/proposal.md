## Why

When two item blocks in the **same file** declare the same ID, the parser keeps the first and silently discards the rest. `antora-tracer validate` reports "No validation errors found", exits `0`, and the item count is lower than the source contains — so the graph loses an item with no diagnostic. A duplicated ID is a copy-paste error that a `next-id` race or a hand-merge can produce, and `validate` is the gate the workflow relies on before archive.

Cross-file duplicates are already caught (the graph reports both definitions and `validate` exits non-zero). Only the same-file case is silent, because the parser drops the duplicate before the graph — the single authority for duplicate detection — sees it.

## What Changes

- Same-file duplicate IDs are reported by `validate` with a non-zero exit, naming both source locations, matching the existing cross-file behaviour.
- The parser keeps dropping the repeated block (the first definition wins) and names **both** locations in its duplicate-ID error, instead of only the second.
- `validate` and the Antora extension surface the parser's duplicate-ID error, which both previously ignored — `validate` read only the graph, and the extension read only `getDuplicateWarnings()`.
- Cross-file duplicate detection (the graph's `duplicate_node`) is unchanged.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities
- `cli-validate`: the "Duplicate item ID is reported" requirement is widened from "across the input files" to any repeated definition, including two blocks in one file.

## Impact

- `src/DocumentParser.ts` — the duplicate-ID error now names both the first and the repeated definition's line.
- `src/cli.ts` — `validate` prints parser errors alongside graph validation errors and exits non-zero.
- `src/antora-extension.ts` — the per-version duplicate check folds in the parser's duplicate-ID errors, so a same-file duplicate fails the build as a cross-file one already did.
- `src/TraceabilityGraph.ts` — unchanged; the cross-file path already reported both locations.
- `test/` — regression tests at the `validate` command level and the extension level.
- No config, snapshot, or API change.
