## 1. Template

- [x] 1.1 `src/templates/matrix.html.mustache` — remove the `<th>Coverage</th>` header
- [x] 1.2 `src/templates/partials/matrix-row.mustache` — remove the `<td>{{coverageFormatted}}%</td>` cell, keep the status badge
- [x] 1.3 `src/templates/partials/styles.mustache` — rename the `coverage-complete` class to `status-done` and update the summary/`complete` labels

## 2. Generator

- [x] 2.1 `src/MatrixGenerator.ts` — change the status value `"complete"` → `"done"` in `generateMatrixFromConfig` and the legacy default generator
- [x] 2.2 `prepareRowForTemplate` — stop emitting `coverageFormatted` (keep the internal `coverage` field); update `statusClass` for the rename

## 3. CLI output

- [x] 3.1 `src/cli.ts` (matrix summary line, if it prints "complete") — update the wording to `done`

## 4. Tests

- [x] 4.1 `test/matrix-generator.test.ts` — assert the HTML has one status cell and no per-row `%`; assert `done`/`partial`/`missing` values; assert the summary still shows overall coverage
- [x] 4.2 Update any test asserting `"complete"` status or `coverageFormatted` to the new values

## 5. Documentation

- [x] 5.1 `how-to/visualizations.adoc` and any reference page describing the matrix output — replace Coverage+Status with the single status column and `done`/`partial`/`missing`
- [x] 5.2 Rebuild the example site and regenerate matrices to confirm the rendered matrices are unchanged except for the column collapse
