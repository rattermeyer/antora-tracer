## Why

`addresses:TARGET[]` inside a backtick code span in ARC-003's documentation table is parsed as a real relationship, producing a validation error: "target 'TARGET' does not exist". The `DocumentParser` skips verbatim blocks (`----` fences) but doesn't skip inline code spans (backtick-enclosed text). Documentation examples inside backticks should not be treated as real traceability data.

## What Changes

- `DocumentParser.parseInlineMacrosFromItems()` filters out backtick-enclosed ranges before matching the inline macro regex
- Reuse the backtick-range detection pattern from `antora-extension.ts`'s `getInlineCodeRanges()`

## Capabilities

### Modified Capabilities

- `parser-verbatim-skip`: Inline relationship macros inside backtick code spans are now skipped during parsing, in addition to the existing verbatim block skipping.

## Impact

- **File modified**: `src/DocumentParser.ts` — `parseInlineMacrosFromItems` method
- **No API changes**
