## 1. Skill file

- [x] 1.1 Write `skills/semantic-relation-review/SKILL.md` to review all outgoing relations in one selected document, use configured roles/relation meanings and linked target content, distinguish structural validity from semantic support, and keep its scope distinct from `abstraction-level-review`. Verify the skill renders in the project's skills index.
- [x] 1.2 Define interactive triage output with document-level counts, actionable findings ordered HIGH / MEDIUM / LOW, separate confidence, concise problem and suggested action, and omission of adequately supported links. Verify examples cover severity independently from confidence.
- [x] 1.3 Define the report consent flow: discuss findings first, offer an AsciiDoc report afterward, confirm destination before writing, and warn about Antora publication/processing when adjacent. Verify declined or unconfirmed reports cause no write and report content has no `[item]` blocks or relationship macros.

## 2. Eval harness

- [x] 2.1 Create `evals/semantic-relation-review/rubric.schema.json` for structured document-level findings with severity, confidence, source, relation, target, problem, and suggestion.
- [x] 2.2 Add synthetic document fixtures covering HIGH, MEDIUM, LOW, distinct confidence values, supported links omitted from findings, and links to targets in other documents. Add a real-smoke case using existing example-site content.
- [x] 2.3 Create `cases.json` for the document fixtures and expected findings. Include observable scenarios that confirm report prompting is after interactive findings and that writing requires explicit path approval.
- [x] 2.4 Write `run.mjs` following the existing eval harness pattern and verify it extracts each document's outgoing edges and linked target content without traversing target documents' outgoing edges.

## 3. Documentation

- [x] 3.1 Update `examples/tracer/modules/ROOT/pages/how-to/evaluate-skills.adoc` to document the new document-level relation-review eval.
- [x] 3.2 Rebuild the example site with `pnpm exec antora antora-playbook.yml` and confirm the updated how-to page renders correctly.

## 4. Verification

- [x] 4.1 Run the eval with `EVAL_MODEL=<available-model> node evals/semantic-relation-review/run.mjs --trials 3` and verify expected severity, confidence, and actionable findings across the cases.
- [x] 4.2 Verify report refusal and unconfirmed-path scenarios do not create files; verify confirmed report output contains no traceability item or relation macros.
- [x] 4.3 Verify existing evals (`npm run eval:requirements`, the abstraction-level-review eval) are not broken by the new files (no shared state or overlapping paths).