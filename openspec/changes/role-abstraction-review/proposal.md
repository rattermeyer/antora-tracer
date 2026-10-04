## Why

The traceability graph already carries everything needed to review whether items of a role in one document sit at a consistent abstraction level — id, title, content, and document position — but no query surface exposes that slice, and no tooling judges it.
Reviewing abstraction drift is today a fully manual read-through, which is exactly the kind of holistic, cross-item judgment an LLM performs well.

## What Changes

- Add a `query by-role <role>` CLI subcommand: extract all items of a role, optionally restricted to one document (`--document <path>`), in document order (`sourceLine`), excluding superseded items by default.
- Add a `--context` option that includes a skeleton of the same document's other-role items (id and title only) as relocation context.
- Support both local AsciiDoc scanning and cross-source `site-graph` snapshots, following the existing `linked`/`siblings` subcommand conventions.
- Add an LLM-judge evaluation (`evals/`, following the existing rubric pattern) that consumes the extraction output and classifies each same-role slice into three verdicts: *rewrite* (right home, wrong altitude in the item's own text), *move within document* (wrong section; skeleton context shows where), and *investigate elsewhere* (suspected role or document mismatch, flagged for human follow-up; v1 does not answer where).
- The judge is an evaluation-layer tool, not a shipped CLI feature; the extraction command is the product surface.

## Capabilities

### New Capabilities
- `role-abstraction-review`: The by-role extraction slice and the three-verdict abstraction review model — what the extraction carries, what the skeleton context contains, and the verdict vocabulary the judge applies.

### Modified Capabilities
- `cli-query`: New `query by-role` subcommand exposing role extraction with document filtering, document ordering, supersession exclusion, skeleton context, and snapshot support.

## Impact

- `src/cli.ts`: new `by-role` subcommand under `query` (graph API `getItemsByRole`/`getCurrentItemsByRole` already exist; no graph changes).
- `evals/role-abstraction-review/`: judge harness (`run.mjs`) following the `requirements-writing` eval pattern (`EVAL_MODEL`, majority-of-trials).
- Tests: CLI tests for extraction semantics; eval cases for the three verdict modes.
- Documentation: `reference/cli.adoc` gains the subcommand; `how-to/query-graph.adoc` gains an extraction section; the eval documents its rubric.
- No changes to parsing, macro rendering, matrix generation, or Neo4j export.
