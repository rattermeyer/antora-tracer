## 1. Failing test first

- [x] 1.1 Add a graph test asserting `validate` emits a `stale_link` warning for a functional relationship stored with the superseded item as source (a `verifies` link). Confirm it fails against current `main`.
- [x] 1.2 Add a graph test asserting `isOrphaned` is false for a superseded item that is the stored source of a live functional link. Confirm it fails against current `main`.

## 2. Fix

- [x] 2.1 Add `getFunctionalLinksInvolving(itemId)` to the graph: non-history relationships whose stored source or target is the item.
- [x] 2.2 Make `isOrphaned` use it.
- [x] 2.3 Make the `stale_link` loop check both endpoints.
- [x] 2.4 Make the CLI `supersession check` worklist use it, reporting the item that still points at the superseded one.

## 3. Verify and document

- [x] 3.1 Run the supersession and query suites and the full suite (`pnpm test`); confirm no regressions and that `addresses`/`depends_on`/`covers` still warn.
- [x] 3.2 Add a `CHANGELOG.md` entry under `## [Unreleased]` → `### Fixed`.
