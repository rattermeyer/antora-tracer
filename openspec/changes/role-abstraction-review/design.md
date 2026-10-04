## Context

The traceability graph exposes `getItemsByRole` and `getCurrentItemsByRole`; item records carry `id`, `title`, `content`, `sourceFile`, `sourceLine`, `role`.
The `query` command already establishes the conventions this change follows: local scanning via a shared graph build, cross-source queries via `site-graph` snapshots with `--input`/`--snapshot` mutual exclusion, table or `--json` output, and unknown-input handling.
The repo's eval pattern (`evals/requirements-writing/run.mjs`) defines the house style for LLM-as-judge harnesses: OpenAI-compatible API, `EVAL_MODEL`/`EVAL_API_KEY` env, strict-majority-of-trials verdicts, explicit "not part of npm test" gating.

## Goals / Non-Goals

**Goals:**
- A supported, tested extraction surface for same-role document slices — the judge's only data source
- Deterministic extraction: same source state produces byte-identical JSON, so judge runs are comparable
- A judge harness that classifies a slice into the three verdicts (rewrite / move within document / investigate elsewhere)

**Non-Goals:**
- Answering *where* an investigate-elsewhere item should go (mode-2 resolution is a follow-up, possibly a two-phase judge)
- Any CLI feature that invokes an LLM — the judge stays in `evals/`
- Rendering surfaces (macros, matrices) for the slice

## Decisions

**Order by `sourceLine` within `sourceFile`.**
Abstraction drift is often positional; the judge needs document order to see neighboring altitudes.
Sort key: `(sourceFile, sourceLine)`. Alternative: graph insertion order — rejected, it depends on file scan order and hides document structure.

**Exclude superseded items (default, no opt-out in v1).**
A judge reviewing current abstraction state gains nothing from historical items; superseded bodies are often the *reason* for drift.
Alternative: `--all` flag — deferred; add when a use case names it.

**`--document` matches on `sourceFile` by suffix/path-equality after Antora normalization.**
Snapshot `sourceFile` values are Antora-relative paths (e.g., `explanation/architecture`). Matching is substring-on-path-segments (a `--document architecture` filter matches `explanation/architecture`), because users type partial paths at the CLI. Exact-match would be predictable but annoying; prefix-of-path-segment is the compromise. Pin the semantics with tests.

**Skeleton context as a separate JSON field, not merged into items.**
`--context` adds `context: [{ id, title, role, sourceLine }]` for other-role items of the matched documents. IDs and titles only — no content, no attributes. This keeps the judge input small (~15 tokens per context item) and the verdict about relocation, not re-summarization.
Alternative: always include skeleton — rejected; the mode-1 (rewrite-only) review doesn't need it and consumers pay for tokens.

**JSON shape is the contract; table output is for humans.**
`--json` emits `{ items: [...], context?: [...] }`. The judge harness shells out to the compiled CLI (`lib/src/cli.js`) with `--json` — it never reimplements filtering. Table output lists ID, title, source file, line.

**Judge = eval-layer rubric, three verdicts, majority of trials.**
Following `evals/requirements-writing`: the harness feeds one extracted slice per case, the model returns per-item verdicts plus a slice-level consistency statement, and a case passes on strict-majority across `--trials` (default 3).
The rubric embeds the three failure modes (wrong-altitude-right-home → rewrite; wrong-section-right-document → move within document; suspected wrong-role/document → investigate elsewhere) and instructs the model *not* to propose destinations for the third.
Eval cases come from the project's own example site: the architecture doc's design slice (known mixed altitudes — goals vs. component specifics) and a synthetic fixture with planted drift per mode.

**`by-role` accepts any role string; unknown roles are not errors.**
An unknown role yields an empty slice, exit 0 — same convention as `isolated --role`. The judge may legitimately probe for a role that a document lacks.

## Risks / Trade-offs

- [Substring document matching surprises] → `--document foo` matches `x/foo` and `foo/y`; pin with tests and document that the filter is a path-segment suffix match. If misfires bite, tighten in v2 without changing the JSON contract.
- [Judge nondeterminism] → majority-of-trials + deterministic extraction input; a slice judged twice from the same JSON should agree within the trial budget.
- [Content size in large slices] → a document with hundreds of same-role items exceeds comfortable judge context. Mitigation: extraction is per-document (the `--document` filter is the intended primary use); the harness warns above a configurable item-count threshold instead of silently truncating.
- [Judge outputs drift from verdict vocabulary] → the harness validates verdicts against the closed three-word vocabulary and fails the case on anything else — no free-text verdicts counted.

## Migration Plan

Additive only: new subcommand, new eval directory. No existing behavior changes; no rollout risk.

## Open Questions

- Eval case sourcing: use the real example-site slices (authentic but drift is historical and partly fixed) vs. synthetic fixtures (controlled but less realistic). Current plan: both; real slices for smoke, synthetic for the three modes. Revisit after the first judge run.
