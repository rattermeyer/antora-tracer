## 1. Fix PreparedFile and prepareFile

- [x] 1.1 Slim `PreparedFile` interface — remove `content` and `blocks` fields, keep `file`, `docAttrs`, `sourceFile`, `component`, `module`
- [x] 1.2 Simplify `prepareFile()` — compute only `docAttrs` and source metadata; remove content/block computation; keep error handling for broken buffers

## 2. Fix expand methods to read live content

- [x] 2.1 Fix `expandRelationMacros` — read content from `prepared.file.contents`, call `findItemBlocks(content)`, use `prepared.docAttrs`
- [x] 2.2 Fix `expandGraphMacros` — same pattern
- [x] 2.3 Fix `expandCoverageMacros` — same pattern
- [x] 2.4 Remove unused `ItemBlock` type alias (blocks no longer cached)

## 3. Verify

- [x] 3.1 Run `npm test` to verify all 275 tests pass
- [x] 3.2 Run `npx antora antora-playbook.yml` and verify NO raw macro text in HTML output
- [x] 3.3 Run `node examples/run-example.js` to verify matrix generation
