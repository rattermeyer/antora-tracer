## 1. Implement verbatim range detection

- [x] 1.1 Add `findVerbatimRanges(content: string)` method to `DocumentParser` that returns `Array<{start: number, end: number}>` for `----` and `....` delimited blocks
- [x] 1.2 Handle blocks with style prefixes (`[source,...]`, `[listing]`) — the fence regex ignores lines before the opening `----`/`....`
- [x] 1.3 Handle unmatched opening fences: log a warning, treat content from opening fence to end-of-file as verbatim

## 2. Guard item parsing

- [x] 2.1 In `parseItemMacros`, call `findVerbatimRanges` once before the item loop
- [x] 2.2 Add guard at top of item loop: if `match.index` falls within any verbatim range, `continue`
- [x] 2.3 In `checkForOldMacros`, add the same guard to skip old-macro matches inside verbatim blocks

## 3. Add tests

- [x] 3.1 Test: `[source,asciidoc]` block with item declarations produces zero items
- [x] 3.2 Test: `[source,asciidoc]` block with item declarations containing inline macros produces zero relationships
- [x] 3.3 Test: real item adjacent to verbatim block is still parsed normally
- [x] 3.4 Test: old macro syntax inside verbatim block does not generate errors
- [x] 3.5 Test: `....` literal blocks are also skipped
- [x] 3.6 Run full test suite (`npm test`) and verify all tests pass

## 4. Verify

- [x] 4.1 Build the example site with `npx antora antora-playbook.yml` and verify no phantom items from source blocks in the user guide
- [x] 4.2 Run `npm run lint` and fix any issues
