## 1. Block-extent helper

- [ ] 1.1 Extract an item's full block (header line through closing `--`) given sourceFile + sourceLine
- [ ] 1.2 Detect ambiguous extent (missing closing delimiter) and refuse

## 2. archive command

- [ ] 2.1 Add `archive <ID>` top-level command: validate superseded, locate block, move to same-module `superseded.adoc`
- [ ] 2.2 Create `superseded.adoc` with a heading when missing
- [ ] 2.3 Reject non-superseded and unknown IDs with no file change

## 3. remove command

- [ ] 3.1 Add `remove <ID>` top-level command: orphaned → normal prompt, isolated → typed-ID prompt
- [ ] 3.2 Reject any other item with no file change
- [ ] 3.3 Preview the block before prompting

## 4. Tests

- [ ] 4.1 Test block-extent extraction (well-formed and malformed)
- [ ] 4.2 Test archive (move, create page, preserve content, reject non-superseded)
- [ ] 4.3 Test remove (orphaned confirm, isolated typed-ID, decline paths, reject non-orphaned)

## 5. Docs

- [ ] 5.1 Document `archive` and `remove` in `reference/cli.adoc`
- [ ] 5.2 Update `how-to/write-traceable-items.adoc` with the supersession lifecycle
- [ ] 5.3 Update `how-to/contribute.adoc` and `explanation/architecture.adoc` for the new commands
