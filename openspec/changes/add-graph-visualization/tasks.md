## 1. Graph serialization

- [x] 1.1 Add `toDot(fromId, depth?)`
- [x] 1.2 Add `toVegaLite(itemId?)`
- [ ] 1.3 Add unit tests for `toDot()` with direct and multi-hop relationships
- [ ] 1.4 Add unit tests for `toVegaLite()` per-item and global modes

## 2. Macro expansion in antora-extension

- [x] 2.1 Add `expandGraphMacros()`
- [x] 2.2 Add `expandCoverageMacros()`
- [x] 2.3 Check `:traceability-graph:` attribute
- [x] 2.4 Encode DOT/Vega-Lite as Kroki URL

## 3. Dashboard page

- [x] 3.1 Create dashboard.adoc
- [x] 3.2 Per-item graphs for key requirements
- [x] 3.3 Dashboard nav entry

## 4. Verify

- [x] 4.1 HTML dashboard with graphs
- [x] 4.2 PDF dashboard with graphs
- [x] 4.3 Graphs stripped without attribute
- [x] 4.4 Existing functionality unaffected
