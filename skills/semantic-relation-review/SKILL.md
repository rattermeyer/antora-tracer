---
name: semantic-relation-review
description: Use when reviewing outgoing traceability links in a design, requirements, architecture, or other controlled document for semantic correctness, missing support, suspicious `addresses` / `refines` links, or prioritized HIGH / MEDIUM / LOW findings.
license: MIT
---

# Semantic Relation Review

Review outgoing relationships across one selected document so a control-document owner can triage questionable traceability before deciding what to change. Judge each link against both endpoint items and the project's relation meaning; a configured, existing edge is not automatically a meaningful one.

## Scope

- Review outgoing relations declared by items in one selected source document.
- Read the full source and target item content for each edge.
- Retrieve targets outside the selected document, but do not expand their outgoing links.
- Keep structural validation separate: use `antora-tracer validate` for allowed role/type pairs, missing targets, and other graph errors.
- Do not repeat abstraction-level review: compare the linked items' meaning, not same-role altitude across document siblings.
- Do not edit source items or relations during the review.

If the user does not identify a document, ask which one and which source tree/playbook to use. If the project has multiple relation models or configs, resolve which one applies before judging.

## Gather evidence

1. Find the effective `traceability.yml` / `traceability.yaml` or preset. Record the configured roles, relation types, and reverse names relevant to outgoing links in the selected document.
2. Find any project documentation or user-provided criteria that define what each relation asserts. Configuration establishes the allowed vocabulary and role pairs; it does not necessarily define semantic criteria. For example, consult the project's traceability model or role guidance for meanings of `addresses` and `refines`.
3. Run structural validation over the source tree that contains the selected document and its targets:

   ```bash
   antora-tracer validate --input <source-root>
   ```

   If it reports structural errors, surface them separately and defer semantic judgment for the affected relations. Do not call an invalid or dangling edge semantically supported or unsupported.
4. Export graph data with the real parser so relation extraction follows the project's AsciiDoc syntax and configuration. Keep the temporary output under the project root because the CLI rejects output paths outside it, and remove the temporary directory after reading the export:

   ```bash
   temp_dir=$(mktemp -d ./.semantic-relation-review.XXXXXX)
   antora-tracer process --input <source-root> --format json --output "$temp_dir"
   ```

   When a non-default config is needed, pass the global `--config <path>` option before `process`. Read `traceability.json` from the temporary directory. For cross-source Antora content, build/use the project's canonical `site-graph` snapshot where needed; retain the same one-document source scope.
5. Select items whose `sourceFile` is the requested document, then select their outgoing edges. For each edge, attach exactly its direct target item's ID, role, title, content, and source location. Do not traverse from that target to further items. If the target is absent, defer it to structural validation.
6. Review only currently relevant items; exclude items the graph identifies as superseded. If the extraction is empty or the document has no outgoing edges, report that and stop without inventing findings.

Do not use `query by-role` alone as the relation source: its context skeleton omits other roles' content and it does not return an edge list. `process --format json` exports parsed items and relationships; use those records to form the selected document's direct source-edge-target pairs.

If the CLI or graph snapshot is unavailable, ask for the source document and linked target item blocks, plus the effective relation config and available relation definitions. State that the review is limited to the supplied material.

## Judge links

For each structurally valid outgoing relation:

1. Read the relation in its configured direction and note its source/target roles.
2. Apply the project's explicit semantic criteria, if available. Do not treat a relation's name, inverse label, matrix coverage, or mere existence as proof of semantic support.
3. Compare the source item's described design/behavior with the target item's stated intent or obligation. For `addresses`, ask whether the source describes a design element that responds to that target requirement. For `refines`, ask whether the source narrows or makes the target requirement more specific while preserving its intent.
4. Distinguish a genuine mismatch from a plausible but indirect relationship. If criteria or item content are insufficient, say what is missing and ask the human to decide rather than inventing a project rule.
5. Omit supported relationships that have no actionable concern.

## Severity and confidence

Severity describes the likely impact of leaving a questionable relation unchanged. Confidence describes the evidence for the judgment; keep them independent.

| Severity | Use when | Typical action |
|---|---|---|
| `HIGH` | The relation is clearly unrelated or materially misleading to traceability, coverage, compliance, or design-control decisions. | Verify the intended target; correct or remove the relation only after human decision. |
| `MEDIUM` | The link could be valid, but support is indirect, incomplete, or depends on an unstated assumption. | Ask the owner to clarify the connection or strengthen the source/target rationale. |
| `LOW` | The relation is substantially supported, with a small, actionable improvement to make the trace clearer. | Consider clarifying the item or adding a direct link; no urgent correction implied. |

Use confidence `high`, `medium`, or `low` for how strongly the available evidence supports the finding. A HIGH-impact concern can have low confidence; explain the uncertainty rather than lowering its severity. Do not manufacture low-severity findings just to fill every severity category.

## Present findings interactively

Start with a short summary of the document, such as item count, outgoing relation count, and number of actionable findings. Then show findings in HIGH, MEDIUM, LOW order. Each finding includes:

- Source ID/title, relation type, and target ID/title.
- Severity and separate confidence.
- A short problem statement grounded in the endpoint content.
- A concise suggested action, phrased as a decision for the document owner, not an automatic edit.

Say when no actionable semantic findings remain. Invite the user to discuss, clarify, or disposition the findings. Preserve any confirmed dispositions for the optional report. Do not offer the report until the findings have been presented and discussed.

## Optional AsciiDoc report

After discussion, ask whether the user wants a report. The review in chat is the default; never write a report automatically.

If the user wants one:

1. Ask for the destination path. An adjacent `.adoc` path may be suggested, never selected implicitly.
2. If the path is inside Antora-managed content, warn that Antora may publish or process it. Wait for explicit acknowledgement and destination confirmation.
3. If a file already exists there, ask before overwriting it.
4. Write only after the user explicitly approves the report and path.
5. Include the reviewed document and scope, a concise summary, findings with severity/confidence/problem/suggested action, and any user-confirmed dispositions.
6. Keep it plain AsciiDoc: no `[item]` block macros, no relationship macros, and no generated claims beyond the reviewed evidence.

A declined report, missing destination, unacknowledged Antora warning, or unapproved overwrite means no file write. In the interactive output, say what approval is still needed.

## Output example

```text
Review: explanation/architecture.adoc — 18 items, 26 outgoing relations, 3 actionable findings.

HIGH — high confidence
ARC-902 → addresses → REQ-902
Problem: the design describes PDF deployment; the requirement is about parsing AsciiDoc items.
Suggested action: verify the intended requirement, then correct or remove this relation.

MEDIUM — medium confidence
ARC-903 → addresses → REQ-903
Problem: the shared diagnostics model may support the admin diagnostics view, but the item does not describe its filtering behavior.
Suggested action: clarify whether this component supports the view or whether another design item should carry the link.

LOW — medium confidence
ARC-904 → addresses → REQ-904
Problem: indexes support performance, but the design does not establish the stated build-time bound.
Suggested action: add measured evidence or qualify the performance claim.
```
