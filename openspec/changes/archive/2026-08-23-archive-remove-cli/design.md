## Context

`orphaned-state` gives us `isOrphaned` (superseded + no incoming functional links) and `isolated` (zero relationships). The graph records each item's `sourceFile` and `sourceLine`, but not the block's end. The CLI is currently read-only. This change adds the first mutating commands and the block-extent machinery they need.

## Goals / Non-Goals

**Goals:**
- `archive <ID>` relocates a superseded block to a parallel `superseded.adoc` page in the same module.
- `remove <ID>` deletes an orphaned block (normal confirm) or an isolated block (louder confirm).
- Safe, precise block manipulation that leaves everything else untouched.

**Non-Goals:**
- No automatic relinking of functional links to an archived/removed item (that's the reviewer's decision; the overview page and `supersession check` surface the worklist).
- No change to the extension's "must not modify source" rule — the CLI is a separate, explicitly-invoked tool.

## Decisions

1. **Archive target is a convention, not config** — the target is `superseded.adoc` in the same module directory as the source (`requirements/pages/index.adoc` → `requirements/pages/superseded.adoc`). Created if missing, with a minimal heading.
2. **Block-extent detection** — from the `[#ID, item, …]` line at `sourceLine`, scan forward to the matching closing `--` delimiter. Refuse to mutate if the block shape is ambiguous (no closing delimiter found).
3. **`archive` only for superseded items** — any other item is rejected with an error and no file change.
4. **`remove` two targets** — `remove <ID>` accepts an orphaned item (prompts `y/N`) or an isolated item (requires typing the ID verbatim). Anything else is rejected.
5. **Successor links are left alone** — after `archive`, `supersedes:OLD[]` becomes a cross-page xref (already handled by `buildXref`); after `remove`, it becomes a dangling reference surfaced by the overview page. No link rewriting in this change.

## Risks / Trade-offs

- [Malformed block corrupts source] → refuse on ambiguous extent; report the file/line and require manual handling.
- [Accidental deletion] → isolated removal requires typing the ID; both paths show the block preview before confirming.
- [Parallel page drift] → archive appends to `superseded.adoc`; if the item is archived twice, the second attempt errors (item no longer superseded after the first? it stays superseded — dedupe by ID).

## Open Questions

- Should `archive` optionally strip the `supersedes:` links from successors, or always leave them? Current call: leave them; cleanup is via `remove` + the dangling worklist.
