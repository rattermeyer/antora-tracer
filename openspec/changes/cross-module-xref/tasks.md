## 1. Data model — Add component and module fields to Item

- [x] 1.1 Add `component?: string` and `module?: string` to the `Item` interface in `src/types.ts`
- [x] 1.2 Add `component?: string` and `module?: string` to `ParseOptions` in `src/DocumentParser.ts` and set both on `item` in `parseItem()`

## 2. Antora extension — Capture and use component/module context

- [x] 2.1 Update `processAsciiDocFile` to capture `file.src.component` and `file.src.module`, pass both as options to `traceability.process()`
- [x] 2.2 Update `index.ts` `process()` method to forward `component` and `module` through to `DocumentParser.parse()` options
- [x] 2.3 Update `expandOutgoingMacros` to capture `currentComponent` and `currentModule` from `file.src`, pass both to `buildXref`
- [x] 2.4 Update `expandIncomingMacros` similarly to capture both and pass to `buildXref`
- [x] 2.5 Update `buildXref` to accept `currentComponent` and `currentModule` params, emit hierarchical xref prefix: cross-component → `component:module:page#id`, cross-module → `module:page#id`, same → `page#id`

## 3. LinkResolver — Module-aware matrix links

- [x] 3.1 Update `LinkResolver.itemToHtmlPath()` to prepend `item.module/` to the path when `item.module` is present

## 4. Tests

- [x] 4.1 Add unit tests in `test/antora-extension.test.ts` for `buildXref` cross-module behavior (same module, different module, no module)
- [x] 4.2 Add unit tests in `test/LinkResolver.test.ts` for module-aware link generation
- [x] 4.3 Add unit test in `test/DocumentParser.test.ts` for `module` field being set on parsed items
- [x] 4.4 Update existing test assertions where `sourceFile` expectations may change

## 5. Integration verification

- [x] 5.1 Build the example site with `npx antora antora-playbook.yml` and verify no xref warnings for cross-module references
- [x] 5.2 Run `node examples/run-example.js` and verify matrix links include module paths
- [x] 5.3 Run `npm test` and confirm all 194+ tests pass
- [x] 5.4 Run `npm run lint` and confirm no new warnings
