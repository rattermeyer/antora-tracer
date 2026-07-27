# Design: Native Asciidoctor IDs

## Context

The current `id=REQ-001` syntax is a custom convention in the `[item]` attribute list. Asciidoctor doesn't interpret it — the extension extracts it for the graph and injects `[[REQ-001]]` anchors for xref resolution. Asciidoctor's native `[#REQ-001]` shorthand creates the `<div id="REQ-001">` automatically.

## Decision: Switch to `[#ID]` Syntax

**Syntax change**:

```
Before:  [item, id=REQ-001, role=requirement, title="User Auth"]
After:   [#REQ-001, item, role=requirement, title="User Auth"]
```

The `#ID` prefix is Asciidoctor's standard block ID shorthand. It appears first in the attribute list.

**Parser change** (`DocumentParser.parseItemBlocks`):

```
Before:  /\[item,([^\]]*)\]/g          — matches [item,...]
After:   /\[#([^,\]]+),\s*item/g       — matches [#ID, item], captures ID
```

The ID is extracted from capture group 1 instead of parsed from the attribute string.

**Title prepending** (`DocumentParser`):

After extracting attributes, the parser prepends the ID to the title:

```typescript
if (title && title !== id) {
  item.title = `${id} — ${title}`;
} else {
  item.title = id;
}
```

This replaces the logic currently in `injectItemHeadings`.

**Extension simplification** (`AntoraTraceabilityExtension`):

- Remove `injectItemHeadings()` method entirely
- Remove the `injectItemHeadings(modifiedContent)` call from Pass 2
- `substituteLinksInFile` only calls `substituteRelationshipLinks`

## Risks

- Breaking change — all existing `.adoc` files using `id=` must update to `[#ID, item, ...]`
- Mitigation: only the example site uses it, no external users yet
