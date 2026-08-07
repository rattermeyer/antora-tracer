## 1. Add `getEmptyStyle` helper

- [x] 1.1 Add `getEmptyStyle()` method to `AntoraTraceabilityExtension` — parses `:traceability-empty:` attribute, returns `"none" | "italic" | "admonition"`, defaults to `"none"`

## 2. Update `buildRelationMacroOutput`

- [x] 2.1 Accept `emptyStyle` parameter in `buildRelationMacroOutput`
- [x] 2.2 When `groups.length === 0` and `emptyStyle !== "none"`, emit placeholder message:
  - `italic`: `_No <direction> relationships._`
  - `admonition`: `[NOTE]\n====\nNo <direction> relationships.\n====`
- [x] 2.3 Pass `emptyStyle` from `expandRelationMacros` call site

## 3. Update tests

- [x] 3.1 Update existing tests that expect empty output for items with no relationships (add `:traceability-empty: none` or accept new behavior)
- [x] 3.2 Add test: `italic` style renders `_No outgoing relationships._`
- [x] 3.3 Add test: `admonition` style renders `[NOTE]` block
- [x] 3.4 Add test: `links[]` with outgoing only + `italic` renders `_No incoming relationships._`
- [x] 3.5 Add test: `links[]` with incoming only + `italic` renders `_No outgoing relationships._`

## 4. Verify

- [x] 4.1 Run `npm test` to verify all tests pass
- [x] 4.2 Run `npx antora antora-playbook.yml` and verify site builds without errors
