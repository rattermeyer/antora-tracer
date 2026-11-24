## 1. Correct the specs

- [x] 1.1 Restate `cli-query`'s `query orphaned` requirement (renamed to drop "incoming") to define orphaned as no functional relationship at either endpoint, and add a scenario for a source-side link.
- [x] 1.2 Reword `item-lifecycle`'s `remove` orphaned requirement and scenario to the same endpoint-agnostic phrase.
- [x] 1.3 Rename `traceable-item-supersession`'s orphaned requirement heading to drop "incoming" (its body was already widened by `fix-supersession-link-orientation`).

## 2. Sync and verify

- [x] 2.1 Sync all three deltas into `openspec/specs/` and confirm `openspec validate --specs` passes.
- [x] 2.2 Confirm no spec still describes orphaned as an incoming-only condition (`grep -rn 'incoming functional' openspec/specs/`).

## 3. Example site

- [x] 3.1 Update REQ-227's title and body and REQ-228's title in `examples/tracer/modules/requirements/pages/index.adoc` to match the renamed headings, and rebuild the site.
