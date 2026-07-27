# Tasks: Clickable Relationship Links

## 1. HTML Post-Processor

- [ ] 1.1 Create `src/HtmlRelationshipLinker.ts` with a regex-based post-processor
- [ ] 1.2 Implement regex matching for `word:TARGET-ID[]` patterns in HTML output
- [ ] 1.3 Look up target items via `TraceabilityGraph.getItem()` and resolve `sourceFile` to page URL
- [ ] 1.4 Replace matched text with `<a href="..." class="traceability-link">TARGET-ID</a>`
- [ ] 1.5 Handle orphan references (target not in graph) — leave text unchanged
- [ ] 1.6 Handle edge cases: invalid ids, already-linked text, content outside item blocks

## 2. Integration

- [ ] 2.1 Integrate `HtmlRelationshipLinker` into `AntoraTraceabilityExtension` page processor
- [ ] 2.2 Ensure graph is populated before post-processing (contentClassified runs first)
- [ ] 2.3 Verify links work in Antora build output with correct relative paths
- [ ] 2.4 Add `class="traceability-link"` for CSS targeting by UI themes

## 3. Testing

- [ ] 3.1 Add unit tests for `HtmlRelationshipLinker` regex matching
- [ ] 3.2 Test link generation with valid targets
- [ ] 3.3 Test graceful fallback for orphan references
- [ ] 3.4 Test that non-relationship text is not modified
- [ ] 3.5 Add integration test in antora-extension test suite for post-processing pipeline
- [ ] 3.6 Verify links render correctly in example site build

## 4. Example Site Update

- [ ] 4.1 Verify `addresses:` and `verifies:` macros in example site become clickable
- [ ] 4.2 Regenerate matrices after update
- [ ] 4.3 Test Antora build with clickable links
