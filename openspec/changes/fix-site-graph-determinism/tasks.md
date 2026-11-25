## 1. Deterministic harvest order

- [x] 1.1 Sort `harvestSiteFiles` output by component, version, module, path, and verify `harvestSiteFiles` returns one stable order across three calls on `antora-playbook.yml`
- [x] 1.2 Verify the order test fails when the sort is removed

## 2. Canonicalization at the collection boundary

- [x] 2.1 Add `harvestIntoGraph(target, playbook)` to `src/SiteGraph.ts` and re-export it from `src/index.ts`
- [x] 2.2 Replace the inline harvest loops in the `site-graph`, `seed`, and `neo4j` commands with `harvestIntoGraph`, and verify `pnpm run build` succeeds with no unused imports
- [x] 2.3 Verify a reverse-authored `verified_by:` edge stores as `TST-001 --verifies--> REQ-001` through `harvestIntoGraph`, and that removing the canonicalize call makes the test fail

## 3. Verify and document

- [x] 3.1 Verify `site-graph` produces byte-identical snapshots across five runs on the real playbook and `diff-graphs` reports no changes
- [x] 3.2 Run `pnpm test` (615 passing) and `pnpm run lint`
- [x] 3.3 Sync the delta spec into `openspec/specs/multi-source-diff/spec.md`
- [x] 3.4 Add the REQ item for snapshot determinism to the example-site requirements index and regenerate the traceability output
