## 1. Block-extent helper

- [x] 1.1 Extract an item's full block (header line through closing `--`) given sourceFile + sourceLine
- [x] 1.2 Detect ambiguous extent (missing closing delimiter) and refuse

## 2. archive command

- [x] 2.1 Add `archive <ID>` top-level command: validate superseded, locate block, move to same-module `superseded.adoc`
- [x] 2.2 Create `superseded.adoc` with a heading when missing
- [x] 2.3 Reject non-superseded and unknown IDs with no file change

## 3. remove command

- [x] 3.1 Add `remove <ID>` top-level command: orphaned → normal prompt, isolated → typed-ID prompt
- [x] 3.2 Reject any other item with no file change
- [x] 3.3 Preview the block before prompting

## 4. Tests

- [x] 4.1 Test block-extent extraction (well-formed and malformed)
- [x] 4.2 Test archive (move, create page, preserve content, reject non-superseded)
- [x] 4.3 Test remove (orphaned confirm, isolated typed-ID, decline paths, reject non-orphaned)

## 5. Docs

- [x] 5.1 Document `archive` and `remove` in `reference/cli.adoc`
- [x] 5.2 Update `how-to/write-traceable-items.adoc` with the supersession lifecycle
- [x] 5.3 Update `how-to/contribute.adoc` and `explanation/architecture.adoc` for the new commands
