## 1. Core Implementation

- [x] 1.1 Add `expandLinksMacros` method to `AntoraTraceabilityExtension` in `src/antora-extension.ts` — builds outgoing and incoming grouped maps and concatenates their AsciiDoc output
- [x] 1.2 Register `expandLinksMacros` in the `contentClassified` event handler alongside `expandOutgoingMacros` and `expandIncomingMacros`

## 2. Tests

- [x] 2.1 Add unit test for `traceability:links[]` with both outgoing and incoming relationships
- [x] 2.2 Add unit test for `traceability:links[]` with only outgoing relationships (no empty incoming section)
- [x] 2.3 Add unit test for `traceability:links[]` with links disabled (remains as literal text)

## 3. Verification

- [x] 3.1 Run `npm test` and confirm all tests pass
- [x] 3.2 Run `npx antora antora-playbook.yml` and verify no errors
- [x] 3.3 Run `npm run lint` and confirm no new warnings
