## 1. Fix toDot traversal

- [x] 1.1 Add reverse-relationship traversal to the BFS loop in `toDot` (src/TraceabilityGraph.ts)
- [x] 1.2 Ensure edge direction is correct for incoming relationships (`fromId → current.id`)

## 2. Verify

- [x] 2.1 Run existing tests: `npm test`
- [x] 2.2 Review and update any `toDot` test expectations that assumed outgoing-only traversal
- [x] 2.3 Rebuild example site: `npx antora antora-playbook.yml`
- [x] 2.4 Verify `traceability:graph[UC-001, 3]` now includes ARC-002 in the generated DOT output
