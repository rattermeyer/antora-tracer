## Why

When two item blocks in the **same file** declare the same ID, the parser keeps the first and silently discards the rest. `antora-tracer validate` reports "No validation errors found", exits `0`, and the item count is lower than the source contains — so the graph loses an item with no diagnostic. A duplicated ID is a copy-paste error that a `next-id` race or a hand-merge can produce, and `validate` is the gate the workflow relies on before archive.

Cross-file duplicates are already caught (the graph reports both definitions and `validate` exits non-zero). Only the same-file case is silent, because the parser drops the duplicate before the graph — the single authority for duplicate detection — sees it.

## What Changes

- Same-file duplicate IDs are reported by `validate` with a non-zero exit, naming both source locations, matching the existing cross-file behaviour.
- The parser stops discarding a same-file duplicate before the graph sees it; duplicate detection happens once, in the graph.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities
- `cli-validate`: the "Duplicate item ID is reported" requirement is widened from "across the input files" to any repeated definition, including two blocks in one file.

## Impact

- `src/DocumentParser.ts` — the per-file duplicate guard that drops the second block.
- `src/TraceabilityGraph.ts` — duplicate detection is the single authority (unchanged behaviour for cross-file duplicates).
- `test/` — a regression test at the `validate` command level.
- No config, snapshot, or API change.
