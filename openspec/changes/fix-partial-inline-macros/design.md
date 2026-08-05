## Context

The `contentClassified` handler in `AntoraTraceabilityExtension` processes files in three passes:

1. **Pass 1** (graph population): Both pages and partials — `processAsciiDocFile()` extracts items and relationships
2. **Pass 2** (macro expansion): Pages only — `expandRelationMacros()`, `expandGraphMacros()`, `expandCoverageMacros()` replace rendering macro placeholders
3. **Pass 3** (link substitution): Pages only — `substituteLinksInFile()` strips `` macros and injects title IDs

Pass 2 and Pass 3 skip partials, but this is incorrect. Partial content reaches the browser when inlined into pages by Asciidoctor. Rendering macros in partials (Pass 2) produce relationship lists for the partial's own items — these are different from the page's items, so no duplication occurs. Inline macros in partials (Pass 3) are invisible data markers that must be stripped.

`substituteLinksInFile()` does three things:
1. `unindentItemMacros()` — strips leading whitespace from `[#..., item, ...]` lines
2. `substituteRelationshipLinks()` — replaces `` with empty string (strips, never generates xrefs)
3. `injectTitleIds()` — prepends item ID to title attribute

All three are safe for partials. None generate xrefs that depend on the file's path context.

## Goals / Non-Goals

**Goals:**
- Strip inline macros from partial file content so they don't appear as raw text in HTML output
- Keep Pass 2 (rendering macro expansion) skipped for partials
- Zero change to public API or rendered output other than the fix

**Non-Goals:**
- Expanding `traceability:outgoing[]` in partials (still skipped)
- Processing partials through the PreparedFile caching pipeline (partials are a separate loop)

## Decisions

### Decision 1: Add partials to existing Pass 2 and Pass 3 loops

```typescript
// Before:
for (const file of pageFilesForVersion) {
  this.substituteLinksInFile(file);
}

// After:
for (const file of pageFilesForVersion) {
  this.substituteLinksInFile(file);
}
for (const file of partialFilesForVersion) {
  this.substituteLinksInFile(file);
}
```

**Rationale:** Keeps pages and partials in separate loops — the page loop already uses PreparedFile caching, and separating keeps the code clear about which passes apply to which file types.

### Decision 2: Apply both Pass 2 and Pass 3 to partials

Rendering macros in partials are now expanded (`traceability:links[]` → relationship lists). This is safe because partials define their own items (different from the page's items), so the rendered relationship lists are for different items — no duplication.

## Risks / Trade-offs

- **[Risk] `injectTitleIds` modifies partial titles**: If a partial item's title is displayed in the page, injecting the ID prefix might be unwanted. → **Mitigation**: `injectTitleIds` only adds `{itemId} — ` before the title text. This is a visible change but matches the behavior for page items and provides consistent item identification.
