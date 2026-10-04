## 1. CLI by-role extraction

- [x] 1.1 Implement `query by-role <role>` in `src/cli.ts` (current items only, ordered by sourceFile then sourceLine, `--document` path-segment-suffix filter, `--json` emitting `{ items, context? }`, table output for humans) and verify CLI tests for role filtering, document filtering, ordering, and supersession exclusion pass
- [x] 1.2 Add `--context` skeleton (other-role items of matched documents as id/title/role/sourceLine) and verify a CLI test asserts the skeleton omits content and excludes the extracted role
- [x] 1.3 Add snapshot support (`--snapshot <path>` with `--input` mutual exclusion, following the `linked`/`siblings` pattern) and verify CLI tests for snapshot loading and rejection pass
- [x] 1.4 Verify empty-role and empty-document results exit 0 with empty output, and `antora-tracer query --help` lists `by-role`

## 2. Documentation
- [x] 2.1 Document `query by-role` in `examples/tracer/modules/ROOT/pages/reference/cli.adoc` (usage examples, `--document`, `--context`, `--snapshot`) and add an extraction section to `how-to/query-graph.adoc`
- [x] 2.2 Rebuild the example site and confirm both pages render the new command

## 3. LLM judge evaluation

- [x] 3.1 Create `evals/role-abstraction-review/run.mjs` following the requirements-writing harness pattern (EVAL_MODEL/EVAL_API_KEY env, `--trials` majority, shells out to `lib/src/cli.js query by-role --json`, validates verdicts against the closed three-word vocabulary) and verify it runs against a synthetic fixture with planted drift for each of the three modes
- [x] 3.2 Add a real-slice smoke case (architecture doc design items) and document the rubric and usage in the eval's README or header comment
