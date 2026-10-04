## Context

Antora Tracer supports configurable relation types between roles (e.g., `design → requirement: addresses`, `requirement → requirement: refines`). The CLI validates structural correctness, but cannot determine whether outgoing links in a document are semantically supported. The `abstraction-level-review` skill reviews same-role items for altitude consistency; it does not inspect linked relations.

The project evaluates skills with deterministic mechanical checks and optional LLM-judge rubrics under `evals/<skill-name>/`.

## Goals / Non-Goals

**Goals:**
- Review all outgoing relations from traceable items in one selected document, considering full source and target content and project relation criteria.
- Present an interactive, concise triage with HIGH / MEDIUM / LOW impact severity, separate confidence, and a short problem and suggested action for each actionable finding.
- Discuss findings with the user before optionally creating an AsciiDoc report at a user-confirmed path.
- Keep the report plain AsciiDoc without `[item]` blocks or relationship macros; warn before placing it in Antora-managed content.
- Evaluate document-level triage and report consent/path safety using synthetic fixtures and a real smoke case.

**Non-Goals:**
- No new CLI subcommand; use existing query commands and source documents to assemble evidence.
- No automatic changes to source content, relations, or configuration.
- No automatic report creation or default adjacent-file write.
- No replacement for `antora-tracer validate` or `abstraction-level-review`.
- No product-side LLM API integration.

## Decisions

**Document-level review, one source document per run.**
The skill extracts outgoing relations only from the selected document, then retrieves target item content as needed; it does not recursively expand into target documents' outgoing edges. This matches design-control review and keeps the reportable scope clear. Existing `query by-role`, `query reverse`, and source reads are the initial evidence sources. A helper subcommand is deferred unless real use proves evidence gathering unworkable.

**Impact severity and confidence are separate.**
HIGH / MEDIUM / LOW describe the likely impact of leaving a relation as written, not certainty that it is wrong. Confidence reflects evidence strength. A potentially high-impact but ambiguous relation remains high impact with low confidence and a question for the user; do not force uncertainty into a medium severity.

**Interactive findings precede report creation.**
Present counts and actionable findings in severity order, each with source ID, relation, target ID, brief problem, suggested action, and confidence. Allow clarification/discussion, then ask whether to create a report. No report or source edit occurs without explicit user approval.

**Report path is always confirmed; adjacent is only a suggestion.**
If the user requests a report, suggest a plain `.adoc` report next to the reviewed document only after noting that Antora may publish or process it. Ask for explicit destination confirmation before writing. Exclude `[item]` blocks and relationship macros so the report does not become traceability input. Never choose or write an adjacent path automatically.

**Relation meanings come from project context.**
Use the project's roles, relation configuration, and explicit relation criteria where available. Do not hard-code meanings as universal rules. When semantic criteria are missing, state that limitation and lower confidence where appropriate.

**Evals focus on review behavior and consent boundaries.**
Synthetic document fixtures cover actionable high-, medium-, and low-impact findings, supported links that should be omitted, uncertain confidence, and relations spanning documents. Include a real-smoke fixture. Deterministic checks cover output structure and that report creation is offered only after findings and requires an approved path; the LLM rubric evaluates semantic judgment.

## Risks / Trade-offs

- [Adjacent reports may be published or reprocessed by Antora] → Warn and require the user to confirm the destination; keep reports free of traceability macros.
- [Severity can be mistaken for confidence] → Show separate fields and fixtures for high-impact/low-confidence findings.
- [Large documents may yield many edges] → Review one document at a time and omit supported, non-actionable links; if context limits arise in real use, add a targeted helper later.
- [No project-specific semantic criteria] → State the limitation and qualify confidence rather than inventing a standard relation meaning.