## Context

`DocumentParser.parse` locates an item header at an absolute character offset
(`src/DocumentParser.ts:158-202`), converts it to a 1-based file line with `lineAt`
(`src/DocumentParser.ts:574-576`) and stores it as `Item.sourceLine`
(`src/DocumentParser.ts:333`). That number is correct and is not in question.

Inline relationship macros are parsed in a second pass,
`parseInlineMacrosFromItems` (`src/DocumentParser.ts:421`), which iterates over
`item.content` — the **trimmed** body produced by `extractBody` (`:558-571`) — and
computes a file line as:

```ts
this.lineAt(itemContent, match.index) + (item.sourceLine || 0);   // :455
```

Two facts make this wrong rather than merely off by one:

- `itemContent` is trimmed, so character index 0 of the body is not the first character after the
  opening delimiter. The distance between them equals the whitespace `extractBody` removed plus the
  delimiter line.
- `lineAt` on the trimmed body returns a 1-based line **relative to the body**, and
  `item.sourceLine` is the line of the header. The valid base is therefore
  `sourceLine + (lines consumed before the body start)`, not `sourceLine`.

Measured deltas from a two-item probe: −1 with no leading blank line, −2 with one, −3 with two.
The error is a function of the document's own whitespace, so no constant correction is correct.

## Goals / Non-Goals

**Goals:**

- Every inline relation reports the file line on which its macro text appears, for any amount of
  leading or interior blank lines in the item body.
- No change to `Item.content`, to which macros are recognised, or to relationship identity.
- The fix is expressed in the parser's existing absolute-offset vocabulary, not as arithmetic on
  trimmed text.

**Non-Goals:**

- Adding a character offset to the public `ItemRelationship` type. `line` remains the reported
  position; offsets stay internal until a consumer (for example an editor edit planner) actually
  needs them.
- Correcting the header-attribute relation path. It reports the header line, which is correct and
  is pinned by `relationship-header-attributes`.
- Changing `lineAt`, `extractBlock` or `extractBody` return shapes beyond what the fix requires.

## Decisions

**Decision 1 — carry the body's absolute start offset, do not re-derive it.**

`extractBlock` already scans for the opening delimiter at an absolute index
(`src/DocumentParser.ts:540-556`). Return the block's absolute start so the body's absolute start is
`blockStart + block.indexOf(delimiter) + delimiter.length + 1`. The macro scan then uses
`lineAt(content, bodyAbsoluteStart + match.index)`.

*Alternative rejected*: adding the count of stripping characters to the current formula — a second
piece of arithmetic compensating for the first, with the same class of bug waiting in it.

*Alternative rejected*: re-scanning the body inside the item loop for its own delimiters — that is a
second block scanner, the mistake already visible in the Antora extension
(`findItemBlocks`, `src/antora-extension.ts:441`) and in the LSP branch's `scanPositions`.

**Decision 2 — keep the trimmed `content` untouched.**

`Item.content` is the item's prose and is contractually the block body without surrounding
whitespace; `GraphSnapshot` and the published `graph.json` carry it, and my fidelity check confirmed
it is byte-identical to the on-disk body (408/408). Trimming is right for content; it is only wrong
as a coordinate system.

**Decision 3 — fix at the single derivation site.**

`parseInlineMacrosFromItems` line arithmetic has exactly one occurrence (`:455`); the other `lineAt`
uses (`:193,195,202` for header errors, `:528,530` for verbatim fences) are absolute already. The
fix therefore touches one expression plus the offset it needs threaded to it.

## Risks / Trade-offs

- **Reported lines move, and consumers may have compensated for the old value** → Verified: no test
  in `test/*.ts` asserts a relationship `line` value, so nothing is pinned to the wrong number and
  nothing needs re-pinning. `cli.ts:1314,1328` sort items by `sourceLine`, not relations.
- **A reader may expect offsets to become public alongside the line** → Keeping offsets internal
  avoids widening `ItemRelationship` before there is a consumer; a later change can expose them
  behind the same offset vocabulary this change introduces.
- **Verbatim and backtick exclusion must not regress** → The scan keeps its existing
  `isInsideRange` checks against `getBacktickRanges`; only the base of the arithmetic changes.

## Migration Plan

None. Reported line numbers become correct; no data, config, or snapshot format changes.

## Open Questions

None. The acceptance number is fixed by measurement: 401 body relations on the example site must
report their macro's own line, and the four probe cases above must report their true lines.
