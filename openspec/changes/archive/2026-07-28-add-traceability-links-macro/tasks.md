## 1. Parse AsciiDoc Document Attributes

- [x] 1.1 Add attribute extraction from document header in antora-extension.ts
- [x] 1.2 Detect `:traceability-links:`, `:traceability-style:`, `:traceability-order:` attributes
- [x] 1.3 Pass attributes through processing pipeline

## 2. Implement links Macro Expansion

- [x] 2.1 Add `expandLinksMacros` method to antora-extension.ts
- [x] 2.2 Implement backward scan from `traceability:links[]` to find enclosing `[#ID, item, ...]`
- [x] 2.3 Query graph for outgoing relationships of enclosing item
- [x] 2.4 Generate AsciiDoc output grouped by relation type
- [x] 2.5 Support list, table, and inline display styles
- [x] 2.6 Support sort order: target-id (default), target-title, relation-type
- [x] 2.7 Handle edge cases: no enclosing item, no relationships, multiple macros in one item

## 3. Modify Inline Macro Handling

- [x] 3.1 Update `substituteRelationshipLinks` to check `:traceability-links:` attribute
- [x] 3.2 Strip inline macros from items that contain `traceability:links[]`
- [x] 3.3 Preserve backward compatibility when attribute is not set

## 4. Wire Into Processing Pipeline

- [x] 4.1 Call `expandLinksMacros` in `contentClassified` handler after graph population
- [x] 4.2 Ensure expansion runs before `substituteRelationshipLinks`
- [x] 4.3 Pass document attributes through the processing chain

## 5. Update Example Site

- [x] 5.1 Add `:traceability-links:` to architecture.adoc header
- [x] 5.2 Add `traceability:links[]` macro to ARC-001 and ARC-002 items
- [x] 5.3 Verify rendered output shows grouped links

## 6. Testing

- [x] 6.1 Run existing test suite to ensure no regressions
- [x] 6.2 Add tests for links macro expansion with various styles
- [x] 6.3 Add tests for inline macro suppression
- [x] 6.4 Add tests for backward compatibility without attribute
- [x] 6.5 Add tests for edge cases (no relationships, no enclosing item)
- [x] 6.6 Verify PDF export compatibility

## 7. Documentation

- [x] 7.1 Document `traceability:links[]` macro syntax and attributes
- [x] 7.2 Document `:traceability-style:` and `:traceability-order:` options
- [x] 7.3 Update user-guide.adoc with usage examples
