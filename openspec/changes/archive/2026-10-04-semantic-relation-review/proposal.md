## Why

Structural validation can confirm that outgoing relations are configured and their targets exist, but it cannot determine whether those links are semantically supported by the linked items. Design-control reviewers need a document-level triage of outgoing relations, with concise, prioritized findings they can discuss before deciding whether to preserve them as a report.

## What Changes

- Add a `semantic-relation-review` skill that reviews outgoing relations across a selected document, using the project's configured relation types and linked item content.
- Present an interactive document summary and actionable findings prioritized by impact as HIGH, MEDIUM, or LOW; report confidence separately from severity.
- For each finding, give a short problem statement and a concise suggested action. Omit relationships with no actionable semantic concern.
- After presenting and discussing findings, ask whether the user wants an AsciiDoc report. Confirm the destination before writing; a suggested adjacent path is optional, not automatic.
- Keep the report free of `[item]` blocks and relationship macros, and warn that placing it in Antora content may publish it or cause it to be scanned.
- Add evals for document-level triage and report behavior, following the existing skill-evaluation pattern.
- Add no CLI subcommand; use existing query commands and source documents to assemble evidence.

## Capabilities

### New Capabilities
- `semantic-relation-review`: Review all outgoing relations in a selected document for semantic support, present prioritized interactive findings, and optionally create a plain AsciiDoc review report after user approval.

### Modified Capabilities
<!-- None — this is a new skill, not a modification of existing capabilities. -->

## Impact

- `skills/semantic-relation-review/SKILL.md`: new skill file.
- `evals/semantic-relation-review/`: new eval directory with document-level fixtures, rubric schema, cases, and runner.
- `examples/tracer/modules/ROOT/pages/how-to/evaluate-skills.adoc`: document the new eval.
- No changes to `src/`, CLI, graph, parser, matrix generator, or Neo4j exporter.