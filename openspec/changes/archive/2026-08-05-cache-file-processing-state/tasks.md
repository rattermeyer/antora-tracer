## 1. Define PreparedFile type and prepareFile method

- [x] 1.1 Add `PreparedFile` interface and `prepareFile(file)` method to `AntoraTraceabilityExtension` — converts buffer→string, calls `parseDocAttributes`, calls `findItemBlocks`, normalizes source/component/module
- [x] 1.2 Add helper to extract `ItemBlock[]` return type from `findItemBlocks` as a shared type alias

## 2. Refactor expand methods to accept PreparedFile

- [x] 2.1 Refactor `expandRelationMacros` signature from `(file: any, macroName)` to `(prepared: PreparedFile, macroName)` — use `prepared.content`, `prepared.docAttrs`, `prepared.blocks`, `prepared.file` for write-back
- [x] 2.2 Refactor `expandGraphMacros` signature from `(file: any)` to `(prepared: PreparedFile)` — same substitution pattern
- [x] 2.3 Refactor `expandCoverageMacros` signature from `(file: any)` to `(prepared: PreparedFile)` — same substitution pattern
- [x] 2.4 Verify `buildRelationMacroOutput` and other helpers still work (they take individual params, not `file` — should need no changes)

## 3. Update contentClassified handler

- [x] 3.1 Restructure the file loop in `contentClassified` to call `this.prepareFile(file)` once, then pass `prepared` to all five expand methods
- [x] 3.2 Merge the two separate file loops (one for relation macros, one for graph/coverage macros) into a single loop over page files

## 4. Verify

- [x] 4.1 Run `npm test` to verify all 275 tests pass
- [x] 4.2 Run `npx antora antora-playbook.yml` and `node examples/run-example.js` to verify example site generation and matrix output
