## Why

Superseded items need an actual lifecycle beyond a rendered marker: moving them out of the main flow (archive to a parallel page) and eventually deleting them (remove). Today both are manual AsciiDoc edits — error-prone, and nothing checks that only the right items are touched. Git preserves history, so removal is safe once the item is orphaned.

## What Changes

- `archive <ID>` CLI: moves a superseded item's block to the module's parallel `superseded.adoc` page. Only superseded items can be archived.
- `remove <ID>` CLI: deletes an orphaned item's block (normal confirmation) or an isolated item's block (louder confirmation, requires typing the ID). Any other item is rejected.
- Block-extent detection: locate an item's full block (`[#ID, item, …]` header through the closing `--`) for safe relocation/deletion.
- These are the first source-mutating CLI commands.

## Capabilities

### New Capabilities

- `item-lifecycle`: archive and remove commands for superseded and obsolete items.

### Modified Capabilities

<!-- none -->

## Impact

- `src/cli.ts` — `archive` and `remove` commands
- `src/DocumentParser.ts` or a new helper — block-extent detection
- `src/TraceabilityGraph.ts` — reuse `isSuperseded` / `isOrphaned`
- Docs: `reference/cli.adoc`, `how-to/write-traceable-items.adoc`, `how-to/contribute.adoc`
