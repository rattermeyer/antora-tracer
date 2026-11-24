## 1. Move the page

- [x] 1.1 Move `examples/tracer/modules/ROOT/pages/explanation/our-traceability-model.adoc` to `examples/tracer/modules/ROOT/pages/self-traceability/our-traceability-model.adoc` with `git mv`, and verify the old path no longer exists and the new one does
- [x] 1.2 Verify the moved file's header, `tracer:config-graph[]` macro, and body are byte-identical to the pre-move file

## 2. Update navigation and cross-references

- [x] 2.1 Remove the `explanation/our-traceability-model.adoc` entry from the Explanation block in `examples/tracer/modules/ROOT/nav.adoc` and add `self-traceability/our-traceability-model.adoc` to the Self-Traceability block, and verify no `explanation/our-traceability-model` string remains in the nav
- [x] 2.2 Update the xref in `explanation/traceability-model.adoc` to `xref:self-traceability/our-traceability-model.adoc[Our Traceability Model]` and verify no `explanation/our-traceability-model` string remains in the example site

## 3. Sync spec and requirements

- [x] 3.1 Sync the delta spec into `openspec/specs/doc-self-traceability/spec.md` so the page enumeration lists Our Traceability Model and Delivery Process
- [x] 3.2 Update the REQ-197 body in `examples/tracer/modules/requirements/pages/index.adoc` to match the new enumeration, and verify `node examples/run-example.js` reports no validation errors and unchanged item counts

## 4. Verify the built site

- [x] 4.1 Build the example site and verify the page renders at `/self-traceability/our-traceability-model.html`, is absent from `/explanation/`, and the nav lists it under Self-Traceability
- [x] 4.2 Verify the `tracer:config-graph[]` diagram still renders on the moved page
