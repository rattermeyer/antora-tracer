## Why

The position and extent of an item block are computed independently in at least three places in
`src/`, with three different answers available and no single function to call.

| Location | Form | Returns |
|---|---|---|
| `DocumentParser.extractBlock` (`src/DocumentParser.ts:540-556`) | absolute character offsets | the block text, or `null` |
| `extractItemBlock` (`src/cli.ts:258-296`) | 1-based line numbers | `{ block, startLine, endLine }`, or `null` |
| `AntoraTraceabilityExtension.findItemBlocks` (`src/antora-extension.ts:441-506`) | absolute offsets | `{ itemId, headerStart, headerEnd, bodyStart, bodyEnd, delimiter }` |

Nothing in the public API (`src/index.ts:581-639`) exposes any of them. Every consumer that needs
block bounds writes its own scan:

- the CLI's `archive` and `remove` call `extractItemBlock` from a `sourceLine` (`src/cli.ts:1763,1827`)
- the extension expands macros using `findItemBlocks` (private)
- a purpose-built editor surface needs the same bounds to plan a text edit
- the unmerged `vscode-extension` branch added a **fourth** scanner (`scanPositions`), which is the
  direct cause of its 2,376 false duplicate-ID diagnostics on the project's own example site

Each copy is a place where verbatim fences, class-prefixed headers, EOF-closed blocks, or delimiter
choice can diverge from the parser. The parser is the authority: it defines what an item block is.

## What Changes

- Add one exported function that returns an item block's bounds — header, body, closing delimiter —
  from the source content and an absolute position.
- Express the bounds in the parser's own vocabulary (absolute character offsets plus 1-based lines),
  so both the CLI's line-oriented use and an editor's offset-oriented use are served by one answer.
- Reuse the parser's existing delimiter and quote-aware scanning rather than introducing new
  matching rules.
- Leave `Item.content` semantics unchanged.

## Capabilities

### New Capabilities
- `item-block-bounds`: a single authoritative accessor for an item block's position and extent, shared
  by every consumer that locates, edits, moves, or deletes item blocks.

### Modified Capabilities

None. `item-lifecycle` specifies *what* `archive` and `remove` do to files, not how they locate a
block; that specification's scenarios remain the acceptance criteria for the consumers after this
change.

## Impact

- `src/DocumentParser.ts` — one shared scan that `extractBlock` and the new accessor both use.
- `src/cli.ts` — `extractItemBlock` becomes a caller of the shared accessor; `archive` and `remove`
  behaviour is unchanged.
- `src/antora-extension.ts` — `findItemBlocks` is redundant against the shared accessor; folding it
  in is in scope when the two agree (see design), and out of scope when they do not.
- `src/index.ts` — one new export; no existing export changes.
- No new dependency, no config change, no snapshot or graph format change.
- The `vscode-extension` branch's fourth scanner becomes redundant but is not modified here; that
  branch is not part of this change.
