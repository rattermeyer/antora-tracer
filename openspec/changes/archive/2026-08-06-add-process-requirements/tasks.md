## 1. Extend example site configuration

- [x] 1.1 Add `process_requirement` role to `examples/traceability.yml` roles list
- [x] 1.2 Add `process_requirement` relations to `examples/traceability.yml`: `requirement: [validates]`, `design: [deploys]`
- [x] 1.3 Add `process-to-product` matrix to `examples/traceability.yml`

## 2. Create delivery process document

- [x] 2.1 Create `examples/component-one/modules/ROOT/pages/delivery-process.adoc` with 6 process requirements (PRQ-001 through PRQ-006):
  - PRQ-001: CI workflows trigger on push and PR
  - PRQ-002: Test suite runs as merge gate
  - PRQ-003: Example site builds without errors
  - PRQ-004: Example site deploys from main branch
  - PRQ-005: Release is tagged and versioned
  - PRQ-006: PDF artifacts are generated alongside HTML
- [x] 2.2 Add `validates:` and `deploys:` relations to each PRC item
- [x] 2.3 Add `traceability:links[]` rendering macros to all PRC items
- [x] 2.4 Add navigation entry in `nav.adoc`

## 3. Update run-example.js

- [x] 3.1 Add `delivery-process.adoc` to the file list in `run-example.js`

## 4. Verify

- [x] 4.1 Run `npm test` to verify no regressions
- [x] 4.2 Run `npx antora antora-playbook.yml` and verify delivery process page renders with expanded macros
- [x] 4.3 Run `node examples/run-example.js` and verify `process-to-product` matrix is generated
