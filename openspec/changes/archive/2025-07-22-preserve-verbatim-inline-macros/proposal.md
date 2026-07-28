## Why

`substituteRelationshipLinks` strips all inline relationship macros (`relation:TARGET[]`) from the rendered page output with a global regex replace. It does not skip verbatim blocks (`[source,asciidoc]` / `----`), so example code in the user guide that demonstrates the macro syntax is rendered blank — the `satisfies:REQ-001[]` text is stripped from the code block, leaving incomplete examples. The parser already skips verbatim blocks (from the prior `parser-verbatim-skip` change), but the rendering pass still processes them.

## What Changes

- `substituteRelationshipLinks` in `AntoraTraceabilityExtension` gains verbatim-block awareness using the same `findVerbatimRanges` approach already applied in `DocumentParser`
- Instead of a blind global regex replace, content is processed in segments: inline macros are stripped from non-verbatim regions, verbatim regions are preserved as-is
- User guide code examples now render correctly with visible inline macro syntax

## Capabilities

### Modified Capabilities
- `parser-verbatim-skip`: Extends verbatim-block preservation to the content substitution pass. The capability now covers both parsing (item/relationship extraction) and rendering (inline macro text stripping).

## Impact

- `src/antora-extension.ts` — add `findVerbatimRanges` method, update `substituteRelationshipLinks` to segment content around verbatim blocks
- Tests — add test verifying inline macros inside `[source,asciidoc]` blocks are preserved in the substitution output
- Example site — user guide code examples now show complete macro syntax
