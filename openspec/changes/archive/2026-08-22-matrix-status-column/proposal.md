## Why

The HTML matrix renders a per-row "Coverage" percentage column immediately beside a "Status" badge column. For the pairwise (single-column) matrices the `requirements-engineering` preset standardized on, that percentage is always 0% or 100% — it carries no information the status badge does not already carry. Even for multi-column matrices, the cells themselves already show exactly which columns are linked, so the percentage is a summary of data that is visible one row up. Two columns say the same thing twice.

## What Changes

- **Collapse Coverage + Status into one column** — the HTML matrix renders a single per-row Status column; the per-row Coverage percentage column is removed.
- **Rename `complete` → `done`** — status values become `done` / `partial` / `missing` (the in-between `partial` only occurs on multi-column matrices, e.g. the `agile` preset).
- **Keep the top Coverage Summary** — the "Complete / Partial / Missing" counts and "Overall Coverage: X%" line are a project-level headline (% of rows done), distinct from per-row status. They stay.
- **CSV unchanged** — it already has no per-row coverage/status column (only the cells plus an "Overall Coverage" summary line).
- **Per-row `coverage` stays in the data model** — it is still computed internally because it derives the status and the overall percentage; only its rendering is removed.

## Capabilities

### New Capabilities

- `matrix-status`: the HTML matrix renders exactly one status column per row with values `done` / `partial` / `missing`, and does not render a per-row coverage percentage.

### Modified Capabilities

<!-- none -->

## Impact

- `src/templates/matrix.html.mustache` — drop the `Coverage` header; keep (rename) the `Status` header.
- `src/templates/partials/matrix-row.mustache` — drop the `<td>{{coverageFormatted}}%</td>` cell; keep the status badge.
- `src/templates/partials/styles.mustache` — rename the `coverage-complete` class to match `done` (or keep class names and only change badge text).
- `src/MatrixGenerator.ts` — `prepareRowForTemplate` stops emitting `coverageFormatted`; status value `complete` → `done`.
- Tests (`test/matrix-generator.test.ts`) and docs (`how-to/visualizations.adoc`, `reference/` pages describing matrix output).
- No new dependencies. No config or graph logic changes.
