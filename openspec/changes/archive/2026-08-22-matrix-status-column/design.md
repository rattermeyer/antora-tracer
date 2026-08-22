## Context

`MatrixGenerator.generateMatrixFromConfig` computes, for each row, a per-row `coverage` percentage as `(coveredColumns / totalColumns) * 100`, then derives a status from it:

```ts
const coverage = (coveredCount / totalColumns) * 100;
const status = coverage === 100 ? "complete" : coverage > 0 ? "partial" : "missing";
```

The HTML template (`matrix.html.mustache` + `matrix-row.mustache`) renders both values side by side:

```html
<th>Coverage</th>   <th>Status</th>
<td>50%</td>        <td><span class="coverage-badge coverage-partial">partial</span></td>
```

For a single-column matrix `coverage` is always 0 or 100, so the percentage column is an exact echo of the status badge. For multi-column matrices it adds a breadth summary, but the matrix cells already display exactly which columns are linked — the percentage summarizes information the reader can see one row up. The `agile` preset has multi-column matrices; `requirements-engineering` (after the pairwise change) has only single-column matrices.

The CSV export already has no per-row coverage/status column — it renders only the cells and a trailing `Coverage: X%` line (the *overall* percentage). So the collapse is an HTML-only change.

## Goals / Non-Goals

**Goals:**

- The HTML matrix shows one status column per row instead of Coverage + Status.
- Status reads `done` / `partial` / `missing` (rename from `complete`).
- The top coverage summary (counts + overall %) remains, because it is a different metric.

**Non-Goals:**

- No change to the CSV export.
- No removal of the internal `row.coverage` field (it derives status and overall %).
- No change to how coverage is computed or how status is derived.
- No change to config, presets, or graph logic.

## Decisions

### D1: Remove the per-row Coverage column, keep Status

`matrix.html.mustache` drops the `<th>Coverage</th>` header; `matrix-row.mustache` drops the `<td>{{coverageFormatted}}%</td>` cell. The Status badge column remains.

### D2: Rename `complete` → `done`

The user-facing status value changes from `complete` to `done`. This touches:
- `MatrixGenerator.generateMatrixFromConfig` and the legacy default generator: `"complete"` → `"done"`.
- The badge text rendered from `{{status}}`.
- The `coverage-complete` CSS class and the summary heading `Complete: {{complete}} / {{total}}` (to `Done: …`).
- Tests and docs that assert or mention `complete`.

Rationale: the user consistently described the collapsed state as "done / partial / missing"; plain language over the current "complete".

### D3: Keep the top Coverage Summary

The summary block (counts of done/partial/missing plus "Overall Coverage: X%") is a project-level headline — the share of rows that are *done* — not a per-row echo. It stays, with the label updated for D2.

### D4: Keep the internal `coverage` field

`row.coverage` is still computed and still exposed on the `MatrixRow` data model and `prepareRowForTemplate` output (as `coverage`), because `status` and the overall percentage are derived from it. Only the `coverageFormatted` display field is removed from the template data.

## Risks / Trade-offs

[Multi-column granularity] → dropping the percentage loses the 25%-vs-75% "how partial" signal for multi-column matrices. Mitigation: the cells still show which columns are linked, and the status badge still distinguishes `partial` from `done`; the user accepted this simplification.

[Rename ripple] → `complete` appears in code, CSS, summary text, CLI output, tests, and docs. Mitigation: the tasks list enumerates each site; a grep for `complete` at review time should find no stragglers except unrelated uses of the word.

[API consumers] → external code reading `row.status === "complete"` would break. Mitigation: `row.status` is an internal data model, not a documented public API; the rename is flagged as a breaking change in the proposal.
