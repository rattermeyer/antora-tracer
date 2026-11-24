## 1. Failing test first

- [x] 1.1 Add a CLI test asserting `validate` reports a same-file duplicate ID with both file locations and exits non-zero. Confirm it fails against current `main`.
- [x] 1.2 Add an extension test asserting the build fails on a same-file duplicate. Confirm it fails against current `main`.

## 2. Fix

- [x] 2.1 The parser names both locations in its duplicate-ID error (first definition line and second), and keeps dropping the second block so the surviving item's relationship offsets stay correct.
- [x] 2.2 `validate` surfaces parser errors alongside graph validation errors.
- [x] 2.3 The extension collects parser duplicate-ID errors for the version and includes them in its existing duplicate-ID build failure.

## 3. Verify and document

- [x] 3.1 Run the full suite (`pnpm test`); confirm no regressions.
- [x] 3.2 Add a `CHANGELOG.md` entry under `## [Unreleased]` → `### Fixed`.
