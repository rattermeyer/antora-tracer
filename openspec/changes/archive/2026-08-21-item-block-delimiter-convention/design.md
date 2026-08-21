## Context

The `DocumentParser` accepts both `--` (open block) and `====` (example block) as `[item]` block delimiters. They parse identically but render differently: `--` flows inline with no frame; `====` renders boxed/shaded.

The site currently mixes them: the data pages (requirements index, architecture, test-plan — 160+ items) use `--`; the prose pages (tutorial, how-to, reference, explanation) use `====`.

The getting-started tutorial also carries stale factual claims: it points at `public/traceability/index.html` and `public/index.html` (output is now `public/docs/` with matrices as attachments), and claims the example's items appear in the `requirements-to-design` matrix when the example has no design item.

## Goals / Non-Goals

**Goals:**
- Make `--` the canonical delimiter everywhere, aligning prose pages to the data pages.
- Document `====` as a valid alternative with its rendering difference.
- Correct the getting-started stale claims.

**Non-Goals:**
- No parser changes — both delimiters stay valid.
- No validation tooling (that is the separate `validate-doc-examples` change).
- No change to the `--`-based data pages.

## Decisions

### D1: `--` is canonical because the data pages already use it

160+ REQ/ARC/TST items use `--`. Migrating ~9 prose pages is the smaller change, and open blocks read as flowing sections rather than boxed entries.

### D2: Document `====` rather than forbid it

The item macro reference SHALL note both delimiters and their rendering difference. The choice is a tradeoff (boxed copy-paste snippets vs flowing data sections); users decide.

### D3: Fix getting-started facts in the same change

The delimiter and the stale claims both live in the prose pages this change touches; fixing them together avoids two passes.

## Risks / Trade-offs

[Tutorial examples lose the framed "copy this" affordance] → acceptable: consistency wins; the reference explains the alternative.

[Over-broad migration] → only prose pages with actual `[item]` example blocks are touched; `====` used as a level-4 heading elsewhere is left alone.

## Open Questions

- Should the tutorial keep `====` for its copy-paste snippet specifically? Lean: no — one convention everywhere.
