## Context

`DocumentParser` is the definition of what an item block is. It recognises the header with a
quote-aware scan (`src/DocumentParser.ts:158-202`), finds the opening delimiter with
`/\n(====|--)\n/` (`:542`), finds the matching closing delimiter with `/\nDELIM(?:\n|$)/` so an
EOF-closed block is accepted (`:548-550`), and skips anything inside verbatim fences
(`:204-210`).

Consumers re-implement subsets of that:

- `extractItemBlock` (`src/cli.ts:258-296`) works on `content.split("\n")`, requires the header regex
  to match the given line, accepts `--` or `====` as the opening delimiter after trimming, and scans
  forward for the same trimmed delimiter. It has no verbatim awareness and no EOF-closed-closing
  handling.
- `findItemBlocks` (`src/antora-extension.ts:441-506`) has its own header regex, its own verbatim
  ranges, an explicit EOF-closed closing delimiter case, and a richer return shape (header and body
  offsets, delimiter).

The differences are real, not cosmetic, so a truthful design has to say which differences survive.

## Goals / Non-Goals

**Goals:**

- One exported accessor answering "where is this block" for every consumer.
- Reuse the parser's delimiter and header scanning, so the parser's accepted grammar and the bounds
  accessor cannot disagree.
- Serve both coordinate systems the existing consumers use: 1-based lines for the CLI, and absolute
  character offsets for editing, with the offsets being the primitive and lines derived.

**Non-Goals:**

- Changing `Item.content` or any snapshot field.
- Making bounds available for items the parser did not register.
- Folding in consumers whose scanning rules disagree with the parser. Where `findItemBlocks` differs
  from the parser (for example the `--` form the parser only accepts as a whole line versus the
  trimmed form the CLI accepts), the divergence is recorded as an explicit decision or as follow-up
  work, not silently unified.
- Modifying the `vscode-extension` branch.

## Decisions

**Decision 1 — the unit is an item block located from a position, not from a line.**

The primitive input is the absolute character offset of the item header, which the parser already
computes (`src/DocumentParser.ts:160`). `Item` records the header's line rather than its offset
(`src/DocumentParser.ts:333`), so a line-taking overload derives the offset by scanning the content
for the start of that line. This keeps one implementation and serves both callers.

*Alternative rejected*: a line-only API. It cannot express an offset precisely once a document uses
mixed line endings, and it forces every offset-oriented consumer to re-derive one.

**Decision 2 — one return shape, offsets primary, lines derived.**

```ts
interface ItemBlockBounds {
  itemId: string;          // as authored in the header
  headerStart: number;     // absolute offset of '['
  headerEnd: number;       // absolute offset just past ']'
  bodyStart: number;       // absolute offset of the first body character
  bodyEnd: number;         // absolute offset just past the last body character
  blockEnd: number;        // absolute offset just past the closing delimiter
  delimiter: "--" | "====";
  startLine: number;       // 1-based, derived
  endLine: number;         // 1-based, derived
}
```

`findItemBlocks` already returns a compatible subset (`headerStart`, `headerEnd`, `bodyStart`,
`bodyEnd`, `delimiter`), which is evidence the shape is the right one rather than a new invention.

**Decision 3 — folding `findItemBlocks` in is conditional on agreement.**

Where `findItemBlocks` already agrees with the parser, its call site moves to the shared accessor.
Where it does not — its header regex accepts `[#ID, item` anywhere in the line while the parser
requires line start plus the class-prefix form — the disagreement is documented and resolved in
favour of the parser, because the parser's grammar is what the build and the graph already obey.
Any consumer that relied on the looser form is identified before the fold.

**Decision 4 — the CLI's looser delimiter acceptance is checked, not assumed.**

`extractItemBlock` accepts a delimiter line after `trim()`, so an indented `  --` is a delimiter to
the CLI. The parser requires the delimiter to be alone on its line (`:542`), which is also what
AsciiDoc requires. Before the CLI's call sites move, a test records which of these two behaviours
real content depends on.

*Measured (tasks 1.1–1.2).* A comparison over fixtures, plus a scan of the example site:

| Fixture | parser | ext. `findItemBlocks` | CLI `extractItemBlock` |
|---|---|---|---|
| plain, class-prefixed, quoted-`]` title, EOF-closed | bounds | bounds | bounds |
| indented `  --` delimiter | none | none | **bounds** |
| item-shaped header inside `----` | none | none | none |
| no delimiter; unterminated | none | none | none |

The example site yields **408 item blocks across 96 AsciiDoc files, with 0 indented delimiter
lines**; 2 files lack a trailing newline, and one of them (`examples/tracer/modules/ROOT/partials/use-cases/validation-and-maintenance.adoc`)
ends in an EOF-closed block the parser already accepts.

**Decision: the CLI adopts the parser's rule.** No real content depends on the looser trimming:
Asciidoctor itself rejects an indented `--` — it reports `unterminated open block` and renders the
line as prose — so a scanner that trimmed the delimiter first disagreed with the renderer. The other
differences (verbatim awareness, EOF-closed acceptance) are places where the CLI was *stricter or
less aware* than the parser; moving it onto the parser's scan is a strict improvement with no
content-side regression.

One correction to the design's premise: `DocumentParser.extractBlock` is *not* itself
verbatim-aware — the skip lives in `parseItemMacros`, which checks the header offset against the
verbatim ranges before calling `extractBlock`. The shared accessor therefore owns the verbatim
check itself (task 2.3), so it cannot report a block for a listing-block header the parser rejects.


## Fold outcome (tasks 3.1–3.3)

Measured against the whole example site (96 AsciiDoc files, 408 item blocks), the shared accessor's
block set is a **strict subset** of the extension's previous `findItemBlocks` set:

- `sharedOnly: 0` — the fold loses no block the parser registers.
- `extOnly: 8` — false blocks the old scan produced by matching `[#ID, item` **anywhere in a line**
  rather than at line start. All 8 came from headers quoted inside prose (`ID`, `UC-NNN`, a
  `REQ-001` repeated in `reference/item-macro.adoc`), and **none contained an expandable macro**, so
  the fold changes no rendered output.

`findItemBlocks` therefore delegates to the shared accessor (task 3.2). The CLI's `extractItemBlock`
does too (task 3.1), and the parser's `extractBlock`/`extractBody` are gone, replaced by one
accessor call in `parseItemMacros` (task 2.4). `test/item-lifecycle.test.ts` passes unchanged, which
is the acceptance gate for the CLI consumers.

**The `vscode-extension` branch is untouched (task 3.3).** It carries a fourth scanner,
`scanPositions` in `vscode/src/server/engine.ts`, cited in the proposal as the source of 2,376 false
duplicate-ID diagnostics. That scanner becomes redundant against the exported accessor, but the
branch is not part of this change and is not modified here; the redundancy is recorded for whoever
rebases it.

## Risks / Trade-offs

- **A shared accessor hides a behavioural difference that a caller depended on** → Mitigation: the
  differences above are enumerated and each is either recorded in a test or made an explicit
  decision; the CLI lifecycle tests (`test/item-lifecycle.test.ts`) remain the acceptance gate for
  `archive` and `remove`.
- **Widening the public API invites a fourth variant later** → Mitigation: the export is the
  parser's own scan, not a new algorithm, and the change ends with the two known duplicates'
  call sites using it.
- **Verbatim handling differs**: the parser skips items inside verbatim fences, `findItemBlocks` has
  its own ranges, `extractItemBlock` has none → Mitigation: the shared accessor uses the parser's
  ranges, and a test asserts an item-shaped header inside a listing block yields no bounds.

## Migration Plan

Existing callers keep their observable behaviour; the internal call graph changes. No data or
format migration.

## Open Questions

- Whether `findItemBlocks` can be deleted in this change or only after its one remaining caller is
  verified against the shared accessor. Decide from the fold check, not in advance.
