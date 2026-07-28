## Why

The `DocumentParser` scans the full AsciiDoc content for `[#ID, item, role=...]` block macros and inline relationship macros (`satisfies:REQ-001[]`). It does not distinguish between real traceability items and example code inside `[source,asciidoc]` or other verbatim blocks (`----`, `....`). This causes phantom items and spurious relationships to be registered in the traceability graph when users document the macro syntax itself — including in the project's own example site and user guide.

## What Changes

- `DocumentParser` gains a verbatim block detection step before `parseItemMacros`
- Item declarations (`[#ID, item, role=...]`) whose positions fall inside a `----` or `....` fence block are silently skipped
- Inline relationship macros inside those skipped items are automatically excluded (they were only scanned within registered item bodies)
- `checkForOldMacros` also skips matches inside verbatim blocks to avoid false deprecation errors
- No changes to the parsing regexes, graph, or extension layer

## Capabilities

### New Capabilities
- `parser-verbatim-skip`: The `DocumentParser` SHALL exclude AsciiDoc verbatim blocks (listing blocks delimited by `----` and literal blocks delimited by `....`) from item and relationship parsing. Items and inline macros appearing inside such blocks SHALL be treated as example text, not traceability data.

### Modified Capabilities
<!-- None — this is a new behavioral capability. Existing specs (traceability-links-macro, incoming-links-macro, matrix-item-linking) are unaffected at the spec level. -->

## Impact

- `src/DocumentParser.ts` — add `findVerbatimRanges()` method, add verbatim-range guard in `parseItemMacros` loop, add guard in `checkForOldMacros`
- Tests — add test cases with `[source,asciidoc]` blocks containing item declarations and inline macros, verifying they are NOT parsed
- Example site — existing false positives from user guide code examples go away; the example site build output changes (fewer phantom items)
