## Why

When a user types a traceability item ID like `REQ-002` into the Antora search box, they expect the search result to link directly to that item's anchor (`#REQ-002`). Currently, the `@antora/lunr-extension` only indexes section headings as navigable chunks — items get their text merged into the parent section, and the search result links to the section heading (e.g., `#_unified_item_macro`) instead of the item itself. This forces users to manually scroll to find the item after clicking a search result.

## What Changes

- Patch `@antora/lunr-extension` to index non-heading HTML elements with `id` attributes as separate searchable chunks with correct anchor hashes
- Each item (e.g., `<div id="REQ-002" class="openblock requirement">`) becomes its own search result linking directly to `#REQ-002`
- Use `patch-package` to maintain the patch in version control until it can be contributed upstream
- No changes to the search UI, Antora playbook, or tracer extension — the fix is entirely in the indexing phase

## Capabilities

### New Capabilities

- `lunr-item-anchor-indexing`: Non-heading elements with `id` attributes in the article body are indexed as navigable search chunks, so searching for an item ID returns a result that links directly to the item's anchor rather than the parent section heading.

### Modified Capabilities

None.

## Impact

- **Dependency patched**: `@antora/lunr-extension` (currently `^1.0.0-alpha.13`) via `patch-package`
- **File modified**: `node_modules/@antora/lunr-extension/lib/generate-index.js` — `extractIndexContent` function
- **New file**: `patches/@antora/lunr-extension+1.0.0-alpha.13.patch`
- **Package scripts**: Add `postinstall` script to apply patches automatically
- **Affected output**: `public/docs/search-index.js` — will contain additional search chunks for item anchors
