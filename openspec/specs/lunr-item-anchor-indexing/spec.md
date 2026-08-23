# Lunr Item Anchor Indexing

## Purpose

Ensure that non-heading HTML elements with `id` attributes inside the article body are indexed as separate searchable chunks by the `@antora/lunr-extension`. This enables search results to link directly to item anchors (e.g., `#REQ-002`) instead of only to parent section headings (e.g., `#_unified_item_macro`).

## Requirements

### Requirement: Non-heading elements with IDs are indexed as navigable anchors
The search index SHALL include every non-heading HTML element inside `<article class="doc">` that has an `id` attribute as a separate searchable chunk. Each chunk SHALL use the element's `id` as its `hash`, enabling search result links to navigate directly to the element's anchor.

#### Scenario: Item anchor is indexed with correct hash
- **WHEN** a page contains `<div id="REQ-002" class="openblock requirement"><div class="title">REQ-002 — item macro</div>...</div>` inside `<article class="doc">`
- **THEN** the generated search index SHALL contain a chunk with `hash` equal to `REQ-002`
- **AND** the chunk's URL fragment SHALL link to `#REQ-002`

#### Scenario: Search for item ID returns item chunk with higher rank
- **WHEN** a user searches for `REQ-002`
- **THEN** the item chunk (hash `REQ-002`) SHALL appear in search results with a higher score than the parent section chunk (hash `_unified_item_macro`)

### Requirement: Item title is extracted from `.title` child element
When an element has a child element with CSS class `title`, the extension SHALL use the text content of that child as the chunk's `title` field. If no `.title` child exists, the element's `id` SHALL be used as the title.

#### Scenario: Element with title child uses descriptive title
- **WHEN** a `<div>` has `id="REQ-002"` and contains a child `<div class="title">REQ-002 — item macro accepts role attribute</div>`
- **THEN** the chunk's `title` SHALL be `REQ-002 — item macro accepts role attribute`

#### Scenario: Element without title child falls back to ID
- **WHEN** a `<span>` has `id="custom-anchor"` and contains no element with class `title`
- **THEN** the chunk's `title` SHALL be `custom-anchor`

### Requirement: Heading elements are excluded from item indexing
Elements that are HTML headings (`h1` through `h6`) SHALL be skipped by the item anchor indexing pass, as they are already indexed by the existing heading-based section chunking.

#### Scenario: Heading with ID is not double-indexed
- **WHEN** a page contains `<h2 id="_unified_item_macro">Unified Item Macro</h2>`
- **THEN** the item anchor indexing pass SHALL NOT create an additional chunk for this heading
- **AND** the heading SHALL only appear as a section chunk from the existing `processNodes` function

### Requirement: Item indexing is scoped to article body
The item anchor indexing SHALL traverse only elements within `<article class="doc">`.

#### Scenario: Navigation elements outside article are excluded
- **WHEN** a page has `<nav class="pagination"><a id="next-page">Next</a></nav>` outside `<article class="doc">`
- **THEN** the search index SHALL NOT contain a chunk for `next-page`
