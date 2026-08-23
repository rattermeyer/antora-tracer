## 1. Splits (supersede with two successors)

- [x] 1.1 `REQ-129` (`bidirectional-relationship-merge`): split into "Reverse-authored relationships are detected" and "No second edge is stored for a complementary pair"; new IDs, each `supersedes:REQ-129[]`; re-point `addresses:`/`verifies:` links
- [x] 1.2 `REQ-071` (`inverse-labels`): split into "Relation display names are config-driven" and "Labels do not affect the graph"; supersede + re-point
- [x] 1.3 `REQ-174` (`preset-inheritance`): split into "A preset does not extend itself" and "Inheritance cycles are detected and rejected"; supersede + re-point
- [x] 1.4 `REQ-215` (`graph-diff`): split into "The diff does not attempt rename detection" and "Supersession appears as added and removed"; supersede + re-point

## 2. Rewrites (single SHALL, no supersession)

- [x] 2.1 `REQ-091` (`parser-verbatim-skip`): rewrite to one SHALL
- [x] 2.2 `REQ-082` (`lunr-item-anchor-indexing`): rewrite to one SHALL
- [x] 2.3 `REQ-167` (`matrix-status`): rewrite to one SHALL
- [x] 2.4 `REQ-199` (`doc-self-traceability`): rewrite to one SHALL

## 3. Deferred

- [x] 3.1 `REQ-103` (`traceability-links-macro`): classify split vs rewrite and apply in a follow-up

## 4. Verification

- [x] 4.1 Spec↔index title diff clean (split items: old title gone, two new titles present; rewrites: same title)
- [x] 4.2 No broken `addresses:`/`verifies:` links; regenerate matrices and rebuild
- [x] 4.3 Full test suite passes; run `update-example-site` reconciliation afterwards
