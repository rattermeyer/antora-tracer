## Context

The `substituteRelationshipLinks` method in `AntoraTraceabilityExtension` is called during Pass 3 of `contentClassified`. Its job is to strip inline relationship macros (`addresses:REQ-001[]`) from the in-memory content buffer — these are pure data markers that should never appear in rendered output.

Currently it does a single `content.replace(relRegex, "")` across the entire page. This also strips macros inside `[source,asciidoc]` blocks, where they are example code that should be displayed to the reader.

The `DocumentParser` already has `findVerbatimRanges()` (from the `parser-verbatim-skip` change) that identifies `----` and `....` block boundaries. The same approach applies here.

## Goals / Non-Goals

**Goals:**
- Preserve inline macro text inside `----` and `....` verbatim blocks during content substitution
- Apply the same verbatim-range detection logic already proven in `DocumentParser`
- Keep the change minimal — only `substituteRelationshipLinks` is modified

**Non-Goals:**
- Share code between `DocumentParser` and `AntoraTraceabilityExtension` (they're in different layers; a small amount of duplication is acceptable)
- Handle other verbatim constructs (backtick blocks, passthrough)

## Decisions

### Decision 1: Segment-based processing instead of regex guard

**Rationale**: A global regex can't express "match this pattern, but only if not inside a verbatim block." The cleanest approach is to split the content into verbatim and non-verbatim segments, process each appropriately, then reassemble.

```
Input:  "text... satisfies:REQ-001[]\n----\nsatisfies:REQ-001[]\n----\ntext..."
                ↓ strip              ↓ preserve           ↓ strip

Output: "text... \n----\nsatisfies:REQ-001[]\n----\ntext..."
```

Alternative considered: negative lookahead in the regex — rejected because AsciiDoc verbatim blocks are stateful (fences), not expressible as a regex lookahead condition.

### Decision 2: Duplicate `findVerbatimRanges` in `AntoraTraceabilityExtension`

**Rationale**: The method is ~30 lines and self-contained. Extracting to a shared utility would add a new module for minimal reuse. The two copies can evolve independently — `DocumentParser` might add `....` block handling that the extension doesn't need, or vice versa.

## Risks / Trade-offs

- **Risk**: The `----` fence regex could match `----` inside a verbatim block that's already being preserved → Not a concern because `findVerbatimRanges` scans the raw content before any processing, and verbatim blocks can't nest in standard AsciiDoc.
- **Risk**: Performance — content is now processed with a regex scan + string segments instead of a single regex replace → The content is already in memory and pages are typically <100KB. The added overhead is negligible compared to Asciidoctor's own processing.
- **Trade-off**: Code duplication between `DocumentParser.findVerbatimRanges` and `AntoraTraceabilityExtension.findVerbatimRanges` → Acceptable for now; can be extracted to a shared utility if the logic grows more complex.
