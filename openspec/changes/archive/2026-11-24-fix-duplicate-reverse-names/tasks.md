## 1. Failing test first

- [x] 1.1 Add a config-loader test asserting that two relations declaring the same `reverse` name for different primaries fail config load with an error naming the reverse name. Confirm it fails against current `main`.
- [x] 1.2 Add a test asserting the same `(primary, reverse)` pair reused across role pairs still loads. Confirm it passes before and after (guards the boundary).

## 2. Fix

- [x] 2.1 In `validateConfig`, track reverse name -> primary while walking relations; report an error when a reverse name maps to a different primary, naming both `sourceRole -> targetRole` pairs. Verify 1.1 passes and 1.2 still passes.

## 3. Verify and document

- [x] 3.1 Run the full suite (`pnpm test`) and confirm every built-in preset still loads; confirm no regressions.
- [x] 3.2 Add a `CHANGELOG.md` entry under `## [Unreleased]` → `### Fixed`.
