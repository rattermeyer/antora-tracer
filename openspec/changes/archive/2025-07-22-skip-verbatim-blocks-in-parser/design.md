## Context

The `DocumentParser.parse()` method performs three passes over AsciiDoc content:
1. `checkForOldMacros` — detects legacy `[req]`, `[imp]` etc. syntax
2. `parseItemMacros` — extracts `[#ID, item, role=...]` blocks and their bodies
3. `parseInlineMacrosFromItems` — scans each registered item's body for `relation:TARGET[]` patterns

None of these passes account for AsciiDoc verbatim blocks. When a user includes example AsciiDoc in a `[source,asciidoc]` block (as the project's own user guide does), the parser treats the example content as real traceability data — registering phantom items and spurious relationships.

The `traceability:outgoing[]` / `traceability:incoming[]` rendering macros are unaffected because they only scan within confirmed item block bodies (fixed in a prior change). But the root cause — phantom item registration — still contaminates the graph.

## Goals / Non-Goals

**Goals:**
- Skip item/relationship parsing within `----` (listing) and `....` (literal) verbatim blocks
- Preserve correct line numbers in parser warnings/errors (no content modification)
- Handle nested verbatim blocks gracefully (inner block wins)

**Non-Goals:**
- Handle all possible AsciiDoc verbatim constructs (backtick blocks, passthrough blocks, inline literals)
- Modify the Antora extension or rendering layer
- Prevent users from intentionally placing traceability items inside verbatim blocks (they can't; it's always an error/example)

## Decisions

### Decision 1: Pre-scan for verbatim ranges, then guard in item loop

**Rationale**: Simpler than modifying regexes or post-filtering. A single pass identifies all verbatim block ranges. The item loop adds a 1-line guard: `if inVerbatimRange(match.index) continue`. This is O(n) for the pre-scan plus O(m) for the guards (m = item count), negligible overhead.

Alternative considered: modifying `parseItemMacros` regex to be verbatim-aware — rejected because AsciiDoc verbatim blocks are stateful (fences), not expressible in a single regex.

### Decision 2: `----` (4 dashes) and `....` (4 dots) only

These are the standard AsciiDoc listing and literal block fences. Both are unambiguous:
- `----` is 4 dashes; item open blocks use `--` (2 dashes), so no collision
- `....` is 4 dots; no other construct uses this

Passthrough blocks (`++++`) and backtick blocks (`` ``` ```) are less common and can be added later if needed.

### Decision 3: Content-preserving skip (no string mutation)

We store `{start, end}` ranges for verbatim blocks and check `match.index` against them. This preserves:
- Original content for other processing
- Correct line numbers in warnings/errors (no shifted offsets)
- The ability to log exactly what was skipped for debugging

Alternative considered: blanking out verbatim content with spaces/newlines — rejected because it complicates line number tracking and adds string allocation overhead.

### Decision 4: Also guard `checkForOldMacros`

Old macro syntax `[req, ...]` inside verbatim blocks is also example text, not real usage. Adding the same verbatim-range guard prevents false deprecation errors from the project's own documentation examples.

## Risks / Trade-offs

- **Risk**: A legitimate item intentionally placed inside a `----` block → Items inside verbatim blocks are never legitimate traceability data. AsciiDoc renders verbatim blocks as monospaced code, not structured content.
- **Risk**: Edge case with unmatched fences (opening `----` without closing) → The regex finds the next `----` as the closer. If no closer exists, the range extends to end-of-file. This could cause items after the unmatched fence to be skipped. Mitigation: log a warning for unmatched verbatim fences.
- **Trade-off**: Only `----` and `....` supported, not `++++` or backticks → These are rarely used for AsciiDoc examples. Can be added incrementally.
