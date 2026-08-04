# Tasks: Reconcile Requirements-to-Design Coverage

## 1. New REQ Items for Three New Specs
- [x] 1.1 Add REQ-108 ("Matrix files synced to component _attachments") to requirements.adoc under a "Matrix Sync" section, sourced from `openspec/specs/matrix-attachment-sync/spec.md`
- [x] 1.2 Add REQ-109 ("Circular reference detection in graph validation") to requirements.adoc under a "Graph Validation" section, sourced from `openspec/specs/circular-reference-detection/spec.md`
- [x] 1.3 Add REQ-110 ("Items defined in partials are processed") to requirements.adoc under a "Partial File Processing" section, sourced from `openspec/specs/partial-file-processing/spec.md`

## 2. Existing ARC Items — Add `addresses:` Links

- [x] 2.1 ARC-017 ("Regex-based parsing"): add `addresses:REQ-087[]` through `addresses:REQ-092[]` (6 verbatim parsing REQs)
- [x] 2.2 ARC-015 ("In-memory processing"): add `addresses:REQ-050[]` and `addresses:REQ-069[]` (2 no-side-effects REQs)
- [x] 2.3 ARC-024 ("Link rendering"): add `addresses:REQ-064[]` through `addresses:REQ-070[]`, `addresses:REQ-100[]`, `addresses:REQ-101[]`, `addresses:REQ-102[]`, `addresses:REQ-104[]` (11 macro feature REQs)
- [x] 2.4 ARC-025 ("Graph visualization macros"): add `addresses:REQ-063[]` (Kroki format REQ)
- [x] 2.5 ARC-016 ("Event-driven Antora integration"): add `addresses:REQ-103[]` (graph isolation REQ)
- [x] 2.6 ARC-018 ("Config-driven validation"): add `addresses:REQ-071[]` (inverse labels REQ)
- [x] 2.7 ARC-019 ("Config-driven matrix generation"): add `addresses:REQ-083[]` through `addresses:REQ-086[]` (4 pairwise preset REQs)
- [x] 2.8 ARC-027 ("Matrix sync"): add `addresses:REQ-108[]` (matrix sync REQ)
- [x] 2.9 ARC-028 ("Circular reference detection"): add `addresses:REQ-109[]` (circular ref REQ)
- [x] 2.10 ARC-029 ("Partial file processing"): add `addresses:REQ-110[]` (partial processing REQ)

## 3. New ARC Items

- [x] 3.1 Create ARC-030 "CI/CD PDF build and deployment pipeline" with `addresses:REQ-060[], REQ-061[], REQ-062[], REQ-093[], REQ-094[], REQ-095[], REQ-096[], REQ-097[], REQ-098[], REQ-099[]`
- [x] 3.2 Create ARC-031 "Static landing page at GitHub Pages root" with `addresses:REQ-072[]` through `addresses:REQ-078[]`
- [x] 3.3 Create ARC-032 "Lunr search extension customization for item anchor indexing" with `addresses:REQ-079[]` through `addresses:REQ-082[]`
- [x] 3.4 Create ARC-033 "Example site: config extension and dashboard patterns" with `addresses:REQ-054[], REQ-105[], REQ-106[], REQ-107[]`

## 4. ADRs and Documentation

- [x] 4.1 Create ADR-006 "DFS-based circular reference detection in graph validation" in `examples/component-one/modules/ROOT/pages/adr/0006-dfs-circular-reference-detection.adoc`
- [x] 4.2 Create ADR-007 "Partial files — graph population only (Pass 1)" in `examples/component-one/modules/ROOT/pages/adr/0007-partial-files-pass-1-only.adoc`
- [x] 4.3 Update `adr/index.adoc` to include the two new ADRs

## 5. Tests

- [x] 5.1 Write tests for partial file processing (ARC-029 / REQ-110): item registration from partials, view URL as sourceFile, Pass 2 skip, version scoping
- [x] 5.2 Update test-plan.adoc `verifies:` links: TST-002 → REQ-108, REQ-110; TST-005 → REQ-109

## 6. Verification

- [x] 6.1 Regenerate matrices (`node examples/run-example.js`) and verify 100% requirements-to-design coverage
- [x] 6.2 Rebuild Antora site (`npx antora antora-playbook.yml`) and verify 0 xref warnings, 0 errors
- [x] 6.3 Run full test suite (`npm test`) — all tests passing including new partial processing tests
