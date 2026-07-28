## 1. Implement collapsible output

- [x] 1.1 Add `getCollapsible(attrs)` helper to parse `:traceability-collapsible:` attribute (same pattern as `isLinksEnabled`)
- [x] 1.2 Thread `collapsible: boolean` parameter through `generateLinksAsciiDoc` → `generateListStyle`
- [x] 1.3 In `generateListStyle`, wrap each group in `[%collapsible]\n.Title\n====\n...\n====\n` when `collapsible` is true
- [x] 1.4 Call `getCollapsible` in both `expandOutgoingMacros` and `expandIncomingMacros`, pass to `generateLinksAsciiDoc`

## 2. Add tests

- [x] 2.1 Test: collapsible enabled wraps list output in `[%collapsible]` blocks
- [x] 2.2 Test: collapsible disabled produces flat output (no `[%collapsible]`)
- [x] 2.3 Test: collapsible has no effect on table style
- [x] 2.4 Test: collapsible has no effect on inline style
- [x] 2.5 Run full test suite (`npm test`) and verify all tests pass

## 3. Verify

- [x] 3.1 Build the example site and verify collapsible blocks render when attribute is set
- [x] 3.2 Run `npm run lint` and fix any issues
