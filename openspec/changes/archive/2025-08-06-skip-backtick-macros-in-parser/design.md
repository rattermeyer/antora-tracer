## Context

`DocumentParser.parseInlineMacrosFromItems()` uses a regex to find inline relationship macros (`addresses:TARGET[]`) in item body content. It already skips verbatim blocks via `findVerbatimRanges()`, but doesn't skip backtick-enclosed code spans. The `antora-extension.ts` has `getInlineCodeRanges()` which builds a list of backtick-enclosed ranges in content — the same approach should be used in the parser.

## Goals / Non-Goals

**Goals:**
- Inline macros inside backtick code spans are not parsed as relationships
- Existing verbatim block skipping continues to work
- No change to the public API

**Non-Goals:**
- Changing how the antora-extension handles backtick ranges (already works)
- Skipping macros inside other formatting (bold, italic) — only code spans

## Decisions

### Decision: Add `getInlineCodeRanges` to DocumentParser

The backtick range detection from `antora-extension.ts`:

```typescript
private getInlineCodeRanges(content: string): Array<{start: number, end: number}> {
  const ranges: Array<{start: number, end: number}> = [];
  const regex = /`([^`]+)`/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    ranges.push({start: match.index, end: match.index + match[0].length});
  }
  return ranges;
}
```

Then in `parseInlineMacrosFromItems`, before processing the regex matches, check if the match position falls within any backtick range and skip it.

### Decision: Check per-match rather than stripping content

Don't modify the content string (which would shift positions). Instead, check `isInsideRange(matchIndex, backtickRanges)` for each regex match and skip if inside.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Nested backticks (escape sequences like \`) | The simple backtick regex handles basic cases; edge cases are rare in documentation examples |
| Performance | Single pass to collect ranges, O(n) per match check — negligible |
