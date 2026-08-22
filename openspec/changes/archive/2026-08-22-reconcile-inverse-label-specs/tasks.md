## 1. incoming-links-macro spec

- [x] 1.1 Rename `### Requirement: Inverse relation type labels` → `### Requirement: Incoming groups use the reverse relation type` and update its body to reference the declared `reverse`
- [x] 1.2 Remove `### Requirement: Fallback to raw type name when no inverse mapping exists` and its scenarios

## 2. preset-inheritance spec

- [x] 2.1 Purpose: "(roles, relations, matrices, inverse labels)" → "(roles, relations, matrices, labels)"
- [x] 2.2 "Merge semantics match config-file `extends`" body: `inverseLabels` → `labels`
- [x] 2.3 "Child overrides parent" scenario: "or inverse label" → "or label"

## 3. traceability-links-macro spec

- [x] 3.1 Scenario under "traceability:links[] macro renders combined outgoing and incoming links": "render with inverse labels" → "render with reverse-type labels"

## 4. graph-visualization spec

- [x] 4.1 Scenario under "Configuration graph via traceability:config-graph[] macro": replace the `inverseLabels` map with a `relations` `reverse` declaration

## 5. Requirements index

- [x] 5.1 Remove `REQ-147` ("Fallback to raw type name when no inverse mapping exists") from `examples/tracer/modules/requirements/pages/index.adoc`
- [x] 5.2 Update `REQ-067` body to match the rewritten "Incoming groups use the reverse relation type" requirement (already references "declared `reverse`")
- [x] 5.3 Remove the now-orphaned `verifies:REQ-147[]` from `test-plan.adoc`

## 6. Verification

- [x] 6.1 `openspec validate reconcile-inverse-label-specs`
- [x] 6.2 Run the full test suite (no behaviour change expected)
