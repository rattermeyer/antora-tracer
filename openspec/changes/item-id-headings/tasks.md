# Tasks: Display Item IDs as Headings

## 1. Heading Injection in Extension

- [x] 1.1 Add `injectItemHeadings()` method to `AntoraTraceabilityExtension` — inserts `[[ID]]` anchor and heading line at the top of each item block
- [x] 1.2 Heading format: `== ID — Title` (or `== ID` if no title set). Use `title` attribute from the parsed item, falling back to item `id`
- [x] 1.3 Integrate into Pass 2 of `contentClassified` (after `substituteRelationshipLinks`, before writing buffer)
- [x] 1.4 Verify item blocks without titles still get a heading with just the ID

## 2. Refactor Example Site

- [x] 2.1 Update 36 requirement items in `requirements.adoc` — move bold heading text into `title` attribute, remove manual `*...*` from content
- [x] 2.2 Update 4 architecture items in `architecture.adoc` — move section titles into `title` attributes
- [x] 2.3 Update 8 test items in `test-plan.adoc` — move test file names into `title` attributes
- [x] 2.4 Verify all items have meaningful `title` attributes

## 3. Testing

- [x] 3.1 Add unit tests for heading injection (item with title, item without title)
- [x] 3.2 Verify xref resolution still works with injected anchors
- [x] 3.3 Verify HTML output shows proper heading markup
- [x] 3.4 Run full test suite — all 194 tests pass

## 4. Verification

- [x] 4.1 Rebuild example site with `npx antora antora-playbook.yml` — 2 warnings (plantuml formatting), 0 errors
- [x] 4.2 Verify headings visible in HTML output for all 48 items
- [x] 4.3 Verify clickable links still navigate to correct headings
