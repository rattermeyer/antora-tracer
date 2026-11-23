## Why

Relationships declared by inline body macros (`satisfies:REQ-001[]`) report a source line that is
wrong, and wrong by a variable amount.

`parseInlineMacrosFromItems` computes the line as
`this.lineAt(itemContent, match.index) + (item.sourceLine || 0)` (`src/DocumentParser.ts:455`),
where `itemContent` is the **trimmed** body returned by `extractBody` (`src/DocumentParser.ts:558-571`).
Line arithmetic measured against a trimmed string cannot map to file lines: the offset depends on how
much leading whitespace `extractBody` removed, so the error grows with the number of blank lines
between the opening delimiter and the first body line.

Measured against the parser (a two-item document, one relation each):

| Body shape | Reported | True | Delta |
|---|---|---|---|
| No leading blank line | 3 | 4 | −1 |
| One leading blank line | 3 | 5 | −2 |
| Two leading blank lines | 3 | 6 | −3 |
| Relation in a later item | 8 | 9 | −1 |

Measured against the self-traceability example site: **401 of 401 body-authored relations are one
line early**, while the 79 relations declared as header attributes are correct because their line
*is* the header line. That split is the signature of the bug — it is exactly the set of relations
whose line is derived from a trimmed body.

Downstream this is user-visible: `validate` names the wrong line for `dangling_link` and
`invalid_relation` warnings (`src/TraceabilityGraph.ts:506-522`), `query reverse` and
`query siblings` print the wrong line (`src/cli.ts:1163,1590`), and any editor feature that jumps to
a relationship macro lands on the neighbouring line.

## What Changes

- Derive inline relation line numbers from absolute offsets in the original document instead of
  from the trimmed body text.
- Thread the body's absolute start offset out of the block extraction step so the macro scan has a
  file-absolute base.
- Add regression coverage for the constant case and for leading-blank-line bodies.

## Capabilities

### New Capabilities
- `source-position-fidelity`: source positions reported for items and their relationships point at
  the construct that was actually authored, in the file's own line numbering.

### Modified Capabilities

None. No existing specification states that a relationship's line is correct, which is why the
defect survived: the requirement is being written rather than corrected.

## Impact

- `src/DocumentParser.ts` — `extractBlock`, `extractBody`, `parseInlineMacrosFromItems`.
- `Item.content` keeps its current trimmed value; only the position arithmetic changes.
- `validate` output and `query reverse` / `query siblings` tables change to the correct line.
- No change to `Neo4jExporter` (its `line` is a local CSV variable, not `sourceLine`).
- No public API change; no new dependency.
