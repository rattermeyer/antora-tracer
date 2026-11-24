## Context

See proposal.md — Why. The `archive` command already locates the block with the shared `ItemBlockBounds` accessor, splices it out of `content.split("\n")`, and writes the remainder back. When the block was the file's only content, the remainder is empty and a zero-byte file is written.

## Goals / Non-Goals

**Goals:** A move leaves no empty source file behind.

**Non-Goals:** Changing what `remove` does to its source file; changing where `superseded.adoc` lives or how the block is appended; rewriting the file only when it is non-empty.

## Decisions

**Decision 1 — unlink when the remainder is empty, keep otherwise.**

After splicing, join the remaining lines and test whether the result is empty or whitespace-only. If so, `unlinkSync(sourcePath)`; otherwise write it back as today. A whitespace-only remainder (for example a trailing blank line the item did not own) is treated as empty, since a file of blank lines carries no content and would be a stub in every practical sense.

*Alternative rejected*: delete whenever the file is empty *before* the splice. The block was removed from a file that may legitimately hold other items, so emptiness must be judged after removal, not before.

**Decision 2 — no change to `remove`.**

`remove` deletes an isolated or orphaned block and may leave the same empty file. The reported issue is about `archive`'s move semantics; `remove` is a delete and its file-keeping behaviour is out of scope here. Folding it in would be an unrequested behaviour change to a command the issue does not name.

## Risks / Trade-offs

- **A source file legitimately becomes empty and the user expected it to stay** → Accepted: an empty `.adoc` has no content, and the issue's expected behaviour is that it is gone. The spec states the rule.
- **A file with a non-empty remainder is never removed** → Intended; other items or prose are preserved.
