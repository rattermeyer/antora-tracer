## Why

A functional link to a superseded item is only reported when the superseded item is the **stored target** of the relationship. When a relation is declared with the superseded item as the stored source — `test → requirement` is declared as `requirement.test.verified_by`, so authoring `verifies:REQ-NNN[]` on a test stores the requirement as source — three supersession checks never see the link: `validate` emits no `stale_link` warning, `supersession check <id>` omits it from "Functional links requiring review", and `query orphaned` can wrongly report the superseded item as orphaned. `verifies` is the affected relation in `minimal`; the workflow's own guidance tells authors to review `verifies` links, so the tool currently hides one it instructs them to review.

## What Changes

- Supersession checks treat a functional link as "to" an item regardless of which endpoint the configured relation stores as its source: `validate`'s stale-link warning, `supersession check`'s worklist, and `isOrphaned` all consider both endpoints.
- `addresses`, `depends_on`, `covers`, and every other relation keep working as today; only links that were previously missed are added.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities
- `traceable-item-supersession`: orphaned state, the stale-link warning, and the review worklist consider a functional link by either endpoint, so a relation declared with the superseded item as source is not missed.

## Impact

- `src/TraceabilityGraph.ts` — the stale-link loop and `isOrphaned`.
- `src/cli.ts` — the `supersession check` worklist.
- `test/supersession.test.ts` — regression tests.
- No config, snapshot, or API removal.
