---
name: abstraction-level-review
description: Review whether all traceable items of one role in one document sit at the same abstraction level, and classify drift into three verdicts - rewrite (right home, wrong altitude in the text), move within document (wrong section), investigate elsewhere (suspected wrong role or document). Use when the user asks to check abstraction levels, review whether items are consistent in altitude, or judge whether an item belongs in its document or role.
license: MIT
---

# Abstraction Level Review

Judge whether the items of one role in one document sit at a consistent
abstraction level, and classify each drifting item into one of three
verdicts with a reason grounded in its siblings.

The method is comparative: an item is judged **relative to its same-role
siblings in the same document**, never against an absolute ideal. A slice
of uniformly concrete items is consistent; a slice of uniformly abstract
items is consistent. Only items that stand out from their siblings get a
finding.

## When to Use

- User asks to "check the abstraction level" of items, a document, or a role
- User says items are "at different altitudes" or "inconsistent in detail"
- User asks whether an item "belongs in this document" or "is really a requirement/design"
- User wants to review a document's items before a release or a restructure
- User pastes several `[item]` blocks of the same role and asks if they are consistent

## The Three Verdicts

| Verdict | Meaning | The fix |
|---|---|---|
| `rewrite` | Right document, right role — the item's own text is at the wrong altitude | Rewrite the item body in place |
| `move_within_document` | Right document, wrong section | Move the item block to the section its siblings and the context skeleton justify |
| `investigate_elsewhere` | The item reads like a different role, or belongs in a different document | Flag it — do **not** propose a destination |

**Never propose a destination for `investigate_elsewhere`.** Deciding
where an out-of-place item goes requires seeing candidate documents this
review does not hold. Flag the item and stop; the human follows up.

### Signals per verdict

**`rewrite`** — the vocabulary and detail are wrong for the role, while the
item's *subject* clearly belongs with its siblings:

- A design item written as requirements ("The system SHALL respond within
  200 ms") among items describing component structure
- A requirement naming classes, files, or internals ("The `DocumentParser`
  SHALL...") among items stating observable behaviour
- Detail altitude mismatches: one item cites config keys and line
  numbers while its siblings state capabilities

**`move_within_document`** — the item is at the right altitude for its role
but lives among the wrong neighbors:

- A deployment-concern design item sitting in a storage-design section,
  while the context skeleton shows where deployment items live
- The item's content matches the document's other sections, not its
  current section

**`investigate_elsewhere`** — the item's altitude matches a *different*
role's register:

- A "design" item stating what the product must do (requirement register)
  among items describing how it is structured
- An item that names outcomes and obligations while its siblings name
  mechanisms and structures

## Procedure

### 1. Discover the project's model

Take roles from the project's `traceability.yml` or its preset. Do not
invent role names. If the user named a role, use it; otherwise ask which
role and which document to review — the review scope is always **one role
in one document**.

### 2. Extract the slice with the CLI

The `antora-tracer` CLI is the single source of truth for the slice. Do
not re-implement the extraction by grepping files.

```bash
# Local scan of a source tree
antora-tracer query by-role <role> --document <doc> --context --json -i <dir>

# Cross-repository: query a site-graph snapshot instead
antora-tracer site-graph <playbook> --out graph.json
antora-tracer query by-role <role> --document <doc> --context --json --snapshot graph.json
```

`--document` matches by path-segment suffix (`architecture` matches
`explanation/architecture`). The JSON carries each item's `id`, `title`,
`content`, `sourceFile`, `sourceLine`, and — with `--context` — a skeleton
of the document's other-role items (`id`, `title`, `role` only). The
skeleton is the relocation context for `move_within_document` verdicts.

If the slice is empty, say so and stop — there is nothing to review.

### 3. Judge the slice

Read the items in document order (the extraction already orders them).
For each item, compare against its same-role siblings:

1. What altitude do the siblings set? (one sentence — this is the
   reference level)
2. Does this item stand out in vocabulary, detail, or register?
3. If it stands out: which verdict, and what named contrast justifies it?

A finding with no named contrast is not a finding. "DES-002 feels vague"
is worthless; "DES-002 states SHALL-performance obligations while DES-001
and DES-004 describe component structure" is a verdict.

Use the context skeleton only to decide *where* a
`move_within_document` item belongs within the document — never to
re-role items based on skeleton titles alone.

### 4. Report

For each finding, report: item ID, verdict, one-sentence reason naming the
contrast, and — for `move_within_document` only — the target section
justified by the skeleton.

Also report the slice's overall level: one sentence on the altitude the
siblings share. If the slice is consistent, say so; a review that finds
nothing is a successful review.

### 5. Act only on confirmation

Draft rewrites (`rewrite`) and moves (`move_within_document`) on request,
present them, and write to the `.adoc` sources only when the user
explicitly confirms. `investigate_elsewhere` is report-only — do not
edit anything for it.

For rewriting a requirement item, defer to the requirements-writing skill
for the technique (EARS, what-not-how); this skill's job ends at the
verdict.

## Fallback: No CLI Available

When `antora-tracer` is not installed or the user pastes `[item]` blocks
directly, judge the pasted slice with the same verdict model:

- The pasted blocks of one role are the slice; their order in the paste is
  document order
- If the user also pastes items of other roles, treat them as the context
  skeleton (titles only, for relocation reasoning)
- Apply the three verdicts and the named-contrast rule identically
- Report the same way; note that item IDs and line numbers come from the
  paste, so moves and rewrites must be located by the user

The fallback loses ordering guarantees and the skeleton's document
position — say so when it matters to a `move_within_document` verdict.

## Guardrails

- **Judge relative to the slice.** Never reject a uniform slice for not
  matching an external ideal of "good requirements".
- **One role, one document per review.** For broader sweeps, run the
  procedure per slice; do not hold multiple documents' items in one
  judgment.
- **Superseded items are already excluded** by the extraction. Do not
  review items the CLI did not return.
- **No verdict without a named contrast** — a reason that cites no sibling
  is an opinion, not a finding.
- **Do not propose destinations** for `investigate_elsewhere` items.
- **Write nothing without explicit user confirmation.**
