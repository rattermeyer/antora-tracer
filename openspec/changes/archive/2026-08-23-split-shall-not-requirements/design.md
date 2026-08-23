## Context

The `requirements-writing` skill now states the atomicity convention: one SHALL per block, and `SHALL NOT` is a separate Unwanted Behaviour requirement. Nine existing requirements violate it by pairing a positive SHALL with a SHALL NOT.

The supersession feature (already implemented) makes a *split* representable: the old bundled requirement is superseded by two successors, each declaring `supersedes:OLD[]`. A *rewrite*, by contrast, needs no supersession — the behaviour is unchanged, only the phrasing is deduplicated.

## Goals / Non-Goals

**Goals:**

- Every requirement has exactly one obligation.
- Genuine splits use supersession, recording "OLD was split into A and B".
- Redundant negations are deduplicated to one SHALL.
- Spec, index, and downstream `addresses:`/`verifies:` links stay consistent.

**Non-Goals:**

- Splitting the compound *positive* SHALLs (Tier 2) — that is a separate change.
- Changing any behaviour — this is documentation restructuring only.
- Splitting `REQ-103` (deferred; see D4).

## Decisions

### D1: Classify each item as split or rewrite

- **Split** when the positive and negative obligations are semantically distinct.
- **Rewrite** when the `SHALL NOT` merely negates the positive (same behaviour twice).

The classification in the proposal is the working set; an item may be reclassified during implementation if the semantics are judged differently.

### D2: Splits use supersession

For a split, the old `REQ` item is superseded by two new items, each declaring `supersedes:OLD[]`. The old item's effective state becomes `superseded` (derived from the graph), it leaves current matrices, and it renders a successor marker. No `status` attribute is set.

Each new item is also a split in the spec file: the single `### Requirement:` becomes two, and the index mirrors both.

### D3: Rewrites edit in place

For a rewrite, the requirement is reworded to one SHALL in both the spec and the index. The `REQ` ID is preserved — no supersession, no downstream link churn.

### D4: Defer `REQ-103`

`REQ-103` ("graph isolation per component version") pairs "macro expansion SHALL be scoped per version" with "items SHALL NOT appear in other versions' xrefs". These are arguably one isolation behaviour stated two ways, but the boundary is ambiguous. Deferred to a follow-up.

### D5: Downstream sweep per split

Each split re-points every `addresses:REQ-OLD[]` and `verifies:REQ-OLD[]` to the new IDs and regenerates matrices. Rewrites need no downstream change (IDs unchanged).

## Risks / Trade-offs

[ID churn] → four splits introduce eight new IDs and re-point downstream links. Mitigation: the supersede link records the mapping, and `update-example-site` reconciles the index afterwards.

[Classification is judgement] → split vs rewrite is a semantic call. Mitigation: D1 permits reclassification; the proposal records the initial judgement.
