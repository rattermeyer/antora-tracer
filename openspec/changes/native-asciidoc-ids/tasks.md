# Tasks: Native Asciidoctor IDs

## 1. DocumentParser Update

- [x] 1.1 Change item regex from `/\[item,([^\]]*)\]/g` to `/\[#([^,\]]+),\s*item/g` — capture ID from `#ID` prefix
- [x] 1.2 Move title prepending logic from extension to parser: prepend `ID — ` to title before storing in graph
- [x] 1.3 Handle items without `#ID` — generate auto ID with warning (existing behavior)

## 2. Extension Simplification

- [x] 2.1 Remove `injectItemHeadings()` method from `AntoraTraceabilityExtension`
- [x] 2.2 Remove `injectItemHeadings(modifiedContent)` call from `substituteLinksInFile`

## 3. Example Site Update

- [x] 3.1 Convert 36 requirement items from `[item, id=REQ-...]` to `[#REQ-..., item, ...]`
- [x] 3.2 Convert 4 architecture items from `[item, id=ARC-...]` to `[#ARC-..., item, ...]`
- [x] 3.3 Convert 8 test items from `[item, id=TST-...]` to `[#TST-..., item, ...]`
- [x] 3.4 Remove ID prefix from titles in example site (parser now does it)

## 4. Verification

- [x] 4.1 Run `npm test` — all tests pass (194)
- [x] 4.2 Run `npx antora antora-playbook.yml` — zero errors, native IDs render
- [x] 4.3 Run `node examples/run-example.js` — 48 items, 85 relationships
- [x] 4.4 Verify `xref:#REQ-001` links resolve and scroll to items
