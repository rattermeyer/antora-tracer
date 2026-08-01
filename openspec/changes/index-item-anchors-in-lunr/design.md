## Context

The Antora Tracer project uses `@antora/lunr-extension` to provide full-text search in the documentation site. The extension's `generate-index.js` extracts content from rendered HTML pages and builds a Lunr index. With the `indexByHeading: true` setting, it splits each page into searchable chunks at heading boundaries (`h1`–`h6`). Each chunk gets a `hash` pointing to the heading's `id` attribute.

Traceability items (requirements, architecture decisions, test cases, etc.) are rendered as `<div>` elements with unique `id` attributes (e.g., `<div id="REQ-002" class="openblock requirement">`). These items live inside section bodies under headings. Currently, their text is merged into the parent section's chunk, and their `id` is never used as a search result hash.

The search UI (`search-ui.js`) builds result links from `doc.url + '#' + sectionTitle.hash`. Without item-level hashes, clicking a search result for `REQ-002` navigates to the section heading (`#_unified_item_macro`) rather than the item anchor (`#REQ-002`).

The fix involves patching `@antora/lunr-extension` using `patch-package`, which captures a diff of `node_modules/` changes and reapplies them on `npm install`.

## Goals / Non-Goals

**Goals:**
- Index every non-heading HTML element with an `id` attribute inside `<article class="doc">` as a separate searchable chunk
- Each chunk uses the element's `id` as its `hash`, so search results link directly to the item anchor
- Extract the element's `.title` child text (if present) as the chunk's `title` for better search ranking
- Zero changes to the search UI or any other part of the system

**Non-Goals:**
- Modifying the Lunr tokenizer or pipeline (IDs like `REQ-002` still split on hyphens — ranking alone makes item chunks win)
- Quick-navigate on exact ID match (separate future feature)
- Upstreaming the patch to `@antora/lunr-extension` (this change uses `patch-package` as a local solution; upstreaming is tracked separately)
- Handling the `indexByHeading: false` path (items are already lumped into page text; this is out of scope)

## Decisions

### Decision 1: Patch `generate-index.js` rather than fork or wrap

**Alternatives considered:**
- **Fork the extension**: Full control but overhead of maintaining a fork, updating for new releases, and publishing to npm
- **Custom Antora extension wrapping Lunr**: Complex — would need to intercept the index file generation or replace the extension entirely
- **Post-process the generated `search-index.js`**: Fragile — would need to parse the built JSON, inject entries, and re-serialize

**Decision**: Use `patch-package`. The change is small (~30 lines), the patch file is reviewable in version control, and `patch-package` automatically applies it on `npm install`. The same diff can be submitted as a PR upstream.

### Decision 2: Index all non-heading elements with `id`, not just known item patterns

**Alternatives considered:**
- **Only index elements matching known patterns** (e.g., `REQ-*`, `ARC-*`): Requires knowledge of item ID formats, brittle to configuration changes
- **Only index `<div>` elements**: Would miss other anchor targets like `<span>`, `<section>`, etc.

**Decision**: Index any non-heading element with an `id`. This is general, correct (every `id` is a valid URL fragment target), and scoped to `<article class="doc">` so TOC/navigation noise is excluded. Headings are already indexed by the existing `processNodes` function and are skipped.

### Decision 3: Extract `.title` child text as the chunk title, fall back to the `id` itself

**Rationale**: Items rendered by the tracer have a `<div class="title">` child with descriptive text (e.g., `REQ-002 — item macro accepts role attribute`). Using this as the chunk's `title` gives it the 10× Lunr title boost, making item chunks rank highest for ID searches. Other elements without a `.title` child (e.g., generic `[#my-anchor]` spans) use the bare `id` as the title.

### Decision 4: Place the new traversal after `processNodes`, not inside it

**Rationale**: The existing `processNodes` function is about heading-based section chunking. Adding item detection inside it would couple two distinct concerns. A separate `collectAnchoredItems` traversal is cleaner, easier to review, and easier to revert or upstream independently.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Duplicate search results**: Item text appears in both the section chunk and the item chunk, so a search might return both | Acceptable — the item chunk ranks higher (title boost), and having the section as context is useful. Can be tuned later by truncating section text. |
| **`patch-package` breakage on extension update**: If `@antora/lunr-extension` updates, the patch may fail to apply | The patch file includes the version in its filename. On upgrade, re-generate the patch. CI will catch apply failures. |
| **Performance**: More entries in the search index | Negligible — each page gets ~10–20 additional small chunks. Lunr handles thousands of documents efficiently. |
| **Elements without meaningful text**: Empty `<a>` anchors or `<div>` wrappers with IDs but no content | `innerText` returns `""` — these become sparse entries in the index. They won't match user queries in practice. |

## Open Questions

None — the design emerged from thorough exploration of the Lunr extension internals, HTML DOM structure, and search UI behavior.
