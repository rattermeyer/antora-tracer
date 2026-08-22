## 1. Add ARC design concepts

- [x] 1.1 Add `ARC-035 Relation reverse declaration and canonical storage` to `architecture.adoc` with `addresses:REQ-129[],REQ-175[],REQ-176[],REQ-177[],REQ-178[]` and a body describing keyed relations + mandatory reverse, canonicalization, derived allowance, and canonicalize+dedupe merge
- [x] 1.2 Add `ARC-036 Preset inheritance and config merge` with `addresses:REQ-170[],REQ-171[],REQ-172[],REQ-173[],REQ-174[]` and a body describing top-level `extends`, deep-merge, transitive chains, missing-parent and cycle detection
- [x] 1.3 Add `ARC-037 Display labels with humanize default` with `addresses:REQ-161[],REQ-162[]` and a body describing `labels` + `humanize()` sentence-case default
- [x] 1.4 Add `ARC-038 Matrix status column` with `addresses:REQ-167[],REQ-168[],REQ-169[]` and a body describing the single per-row status column

## 2. Spec

- [x] 2.1 Sync the `doc-self-traceability` ADDED requirement to the main spec

## 3. Verification

- [x] 3.1 Re-run the REQ→ARC coverage diff to confirm `REQ-129`, `REQ-161/162`, `REQ-167–178` are now addressed
- [x] 3.2 Rebuild the example site (`node examples/run-example.js` + `npx antora antora-playbook.yml`) and confirm the `requirements-to-design` matrix coverage improves and no xref errors appear
