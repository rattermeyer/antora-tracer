## 1. Fix Pass 2 and Pass 3 loops

- [x] 1.1 Add `partialFilesForVersion` to the Pass 3 loop in `contentClassified` — run `substituteLinksInFile` on partial files after pages
- [x] 1.2 Add `partialFilesForVersion` to the Pass 2 loop in `contentClassified` — run `expandRelationMacros`, `expandGraphMacros`, `expandCoverageMacros` on partial files after pages
- [x] 1.3 Run `npm test` to verify 275 tests pass
- [x] 1.4 Run `npx antora antora-playbook.yml` and verify `addresses:QA-055[]` and `traceability:links[]` no longer appear as raw text in `architecture.html`

## 2. Update spec

- [x] 2.1 Apply the delta spec to `openspec/specs/partial-file-processing/spec.md` — update requirement and scenarios for Pass 2 and Pass 3
