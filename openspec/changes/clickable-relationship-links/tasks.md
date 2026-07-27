# Tasks: Clickable Relationship Links

## 1. Source Substitution Logic

- [ ] 1.1 Implement regex-based substitution in `AntoraTraceabilityExtension` contentClassified handler
- [ ] 1.2 Match `word:TARGET-ID[]` patterns within item block content
- [ ] 1.3 Replace with Asciidoctor xref: same-page items use `xref:#ID[ID]`, cross-page items use `xref:page.adoc#ID[ID]`
- [ ] 1.4 Look up target item in graph to determine if same-page or cross-page via sourceFile
- [ ] 1.5 Handle orphan references (target not in graph) — leave text unchanged
- [ ] 1.6 Modify content catalog entries in-memory (no disk writes)

## 2. Integration

- [ ] 2.1 Add substitution step after parser runs but before Asciidoctor renders in contentClassified handler
- [ ] 2.2 Verify original `.adoc` files remain unchanged on disk
- [ ] 2.3 Test that document parser still extracts relationships correctly from modified content
- [ ] 2.4 Test both HTML build (antora-playbook.yml) and verify xrefs resolve

## 3. Testing

- [ ] 3.1 Add unit tests for substitution regex matching
- [ ] 3.2 Test same-page xref generation (target on same page)
- [ ] 3.3 Test cross-page xref generation (target on different page)
- [ ] 3.4 Test orphan reference handling (text left unchanged)
- [ ] 3.5 Test non-relationship text is not modified
- [ ] 3.6 Test content catalog modification doesn't affect subsequent pages
- [ ] 3.7 Verify parser still works after substitution

## 4. Example Site Update

- [ ] 4.1 Verify xrefs resolve correctly in example site Antora build
- [ ] 4.2 Verify no xref warnings in Antora output
- [ ] 4.3 Regenerate matrices after update
