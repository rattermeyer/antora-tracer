## 1. Rename `links[]` → `outgoing[]` in source

- [x] 1.1 Rename method `expandLinksMacros` → `expandOutgoingMacros` and update the method's JSDoc comment
- [x] 1.2 Update macro regex from `/traceability:links\[\]/g` to `/traceability:outgoing\[\]/g`
- [x] 1.3 Update the `content.includes("traceability:links[]")` guard to check for `traceability:outgoing[]`
- [x] 1.4 Update warning message from `"traceability:links[] found outside an item block"` to reference `traceability:outgoing[]`
- [x] 1.5 Update Pass 2 comment from `"Expand traceability:links[] macros"` to `"Expand traceability:outgoing[] macros"`
- [x] 1.6 Update the call site in `registerContentClassifier` from `this.expandLinksMacros(file)` to `this.expandOutgoingMacros(file)`
- [x] 1.7 Update comment in `substituteRelationshipLinks` referencing `traceability:links[]` to reference `traceability:outgoing[]`
- [x] 1.8 Update `itemsWithLinksMacro` set name to `itemsWithOutgoingMacro` and all references

## 2. Add `traceability:incoming[]` macro expansion

- [x] 2.1 Add `itemsWithIncomingMacro` set to track items using the incoming macro
- [x] 2.2 Create `expandIncomingMacros` method following the same pattern as `expandOutgoingMacros`, using `graph.getReverseRelationships()` instead of `graph.getRelationships()`
- [x] 2.3 Implement inverse label transformation: look up `rel.type` in `INVERSE_MAP`, fall back to raw type name if not found, capitalize for display
- [x] 2.4 Add incoming macro call in Pass 2 loop (after outgoing expansion, before substituteLinks)
- [x] 2.5 Update `substituteRelationshipLinks` inline-macro suppression to include items with incoming macro (check both `itemsWithOutgoingMacro` and `itemsWithIncomingMacro`)
- [x] 2.6 Clear `itemsWithIncomingMacro` set at start of Pass 2 alongside `itemsWithOutgoingMacro`

## 3. Update example site

- [x] 3.1 Rename all `traceability:links[]` → `traceability:outgoing[]` in `examples/modules/ROOT/pages/architecture.adoc`
- [x] 3.2 Add `traceability:incoming[]` to at least one item in architecture.adoc that is targeted by other items
- [x] 3.3 Update `examples/modules/ROOT/pages/user-guide.adoc` prose to reference `traceability:outgoing[]` and document `traceability:incoming[]`
- [x] 3.4 Update `examples/modules/ROOT/pages/developer-guide.adoc` prose referencing the macro name
- [x] 3.5 Update `examples/modules/ROOT/pages/sphinx-comparison.adoc` macro reference
- [x] 3.6 Update `examples/modules/ROOT/pages/requirements.adoc` — rename `traceability:links[]` references, update REQ-044 for outgoing, add new REQ for incoming

## 4. Add tests

- [x] 4.1 Add unit tests for `expandOutgoingMacros` covering: item with relationships, item without relationships, macro outside item block, multiple macros in same item, each style (list/table/inline), each sort order
- [x] 4.2 Add unit tests for `expandIncomingMacros` covering: item with incoming relationships, item without, macro outside item block, inverse label transformation (known and unknown types), coexistence with outgoing macro
- [x] 4.3 Add integration test verifying both macros expand correctly in a page with bidirectional relationships
- [x] 4.4 Run full test suite (`npm test`) and verify 194+ tests pass

## 5. Verify

- [x] 5.1 Build the example site with `npx antora antora-playbook.yml` and verify both macros render correctly
- [x] 5.2 Run `npm run lint` and fix any issues
- [x] 5.3 Manual review: confirm `.adoc` source files on disk are not modified by macro expansion
