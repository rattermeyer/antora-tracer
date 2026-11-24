## 1. Failing test first

- [x] 1.1 Add a lifecycle test asserting that `archive <id>` removes a source file whose only content was the archived block, and that no zero-byte `.adoc` remains at that path. Run `pnpm mocha lib/test/item-lifecycle.test.js` and confirm the new test fails against current `main`.
- [x] 1.2 Add a test asserting that `archive <id>` keeps a source file that still holds other items, with the block removed and the rest intact. Confirm it passes before and after the fix (guards the boundary).

## 2. Fix

- [x] 2.1 In the `archive` command, after splicing the block out, unlink the source file when the remaining content is empty or whitespace-only; otherwise write it back as today. Verify 1.1 now passes.

## 3. Verify and document

- [x] 3.1 Run the full lifecycle suite (`pnpm mocha lib/test/item-lifecycle.test.js`) and the full suite (`pnpm test`); confirm no regressions.
- [x] 3.2 Add a `CHANGELOG.md` entry under `## [Unreleased]` → `### Fixed`.
