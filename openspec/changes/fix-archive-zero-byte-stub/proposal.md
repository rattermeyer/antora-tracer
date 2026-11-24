## Why

`antora-tracer archive <id>` moves an item's block to `superseded.adoc` but leaves the source file behind at zero bytes when the file held only that item. The emptied file is still a `.adoc`, so Antora's content classifier picks it up, it appears in greps and listings as an item that no longer exists, and every archive needs a manual `rm`. The command is documented as a *move*, so the leftover file contradicts its own description.

## What Changes

- After `archive` removes a block from a source file, unlink that file when it is empty (or whitespace-only) once the block is removed, so the block is truly moved rather than copied-then-emptied.
- Leave the file in place when it still holds other content, unchanged from today.
- `remove` is not affected: it already operates on files that may hold other items, and its source file keeps any remaining content.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities
- `item-lifecycle`: `archive` removes the source file when the archived block was its only content, so a move leaves no empty stub behind.

## Impact

- `src/cli.ts` — the `archive` command, after splicing the block out of `lines`.
- No config, graph, snapshot, or API change.
