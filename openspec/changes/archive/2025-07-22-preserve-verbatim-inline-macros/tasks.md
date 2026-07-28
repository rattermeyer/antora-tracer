## 1. Add verbatim-range detection to AntoraTraceabilityExtension

- [x] 1.1 Add `findVerbatimRanges(content: string)` private method to `AntoraTraceabilityExtension` — mirrors the logic in `DocumentParser` for `----` and `....` fence detection
- [x] 1.2 Update `substituteRelationshipLinks` to use segment-based processing: preserve verbatim blocks, strip macros from non-verbatim segments

## 2. Add tests

- [x] 2.1 Test: inline macro inside `[source,asciidoc]` block is preserved in substitution output
- [x] 2.2 Test: inline macro outside verbatim block is still stripped
- [x] 2.3 Test: mixed content with macros both inside and outside verbatim blocks
- [x] 2.4 Run full test suite (`npm test`) and verify all tests pass

## 3. Verify

- [x] 3.1 Build the example site with `npx antora antora-playbook.yml` and verify inline macros in user guide source blocks are visible
- [x] 3.2 Run `npm run lint` and fix any issues
