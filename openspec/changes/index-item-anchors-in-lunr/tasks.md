## 1. Implement the indexing fix

- [x] 1.1 Add `collectAnchoredItems` function to `extractIndexContent` in `node_modules/@antora/lunr-extension/lib/generate-index.js`
- [x] 1.2 Insert call to `titles.push(...collectAnchoredItems(contextNodes))` after the existing `processNodes` block

## 2. Generate the patch

- [x] 2.1 Run `npx patch-package @antora/lunr-extension` to create `patches/@antora/lunr-extension+1.0.0-alpha.13.patch`
- [x] 2.2 Verify patch file content is clean and reviewable

## 3. Configure automatic patch application

- [x] 3.1 Add `"postinstall": "patch-package"` to `package.json` scripts

## 4. Verify

- [x] 4.1 Run `npm run build` to ensure the build succeeds
- [x] 4.2 Run `npx antora antora-playbook.yml` to rebuild the example site with the patched extension
- [x] 4.3 Inspect `public/docs/search-index.js` to confirm item chunks exist with correct hashes (e.g., `"hash":"REQ-001"` entries in document store)
- [x] 4.4 Run `npm test` to confirm no regressions (194 tests)
