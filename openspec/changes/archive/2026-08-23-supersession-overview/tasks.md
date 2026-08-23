## 1. Graph queries

- [x] 1.1 Add `getDanglingReferences()`: relationships whose target item does not exist
- [x] 1.2 Add active/superseded counts (reuse `getCurrentItemsByRole` and `isSuperseded`)
- [x] 1.3 Classify dangling links: history types (`supersedes`/`superseded_by`) advisory, others errors

## 2. Overview page generation

- [x] 2.1 Add overview config keys (target `component:module:page` / output file)
- [x] 2.2 Generate overview content at `sitePublished` (totals, per-role table, dangling worklist)
- [x] 2.3 Wire the overview into the dashboard `index.html` or content catalog

## 3. Render toggle

- [x] 3.1 Add `renderSuperseded` config key (default true)
- [x] 3.2 Skip superseded item blocks in the content pass when disabled
- [x] 3.3 Skip `supersedes`-related links in successor blocks when disabled

## 4. Tests

- [x] 4.1 Test `getDanglingReferences` and dangling classification
- [x] 4.2 Test overview generation counts and worklist rows
- [x] 4.3 Test render toggle (blocks hidden, graph/matrices unchanged)

## 5. Docs

- [x] 5.1 Document overview + render toggle in `reference/configuration.adoc`
- [x] 5.2 Update `how-to/visualizations.adoc` with the overview page
- [x] 5.3 Update `reference/traceability-macros.adoc` for the render toggle
