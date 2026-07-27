# Design: Clickable Relationship Links

## Context

The `DocumentParser` extracts inline relationship macros (`addresses:REQ-001[]`) from `[item]` block content and stores them as `ItemRelationship` objects in the `TraceabilityGraph`. Asciidoctor renders the macro text as-is — it has no knowledge of the traceability graph.

We need to make the rendered text navigable. The approach must work for both HTML output (via Antora's default site generator) and PDF output (via `@antora/pdf-extension`).

## Goals / Non-Goals

**Goals:**
- Render `addresses:REQ-001[]` as clickable links in HTML and PDF
- Links navigate to the target item within the same page or to the target item's source page
- Work within the existing Antora extension event pipeline
- No changes to on-disk `.adoc` files
- No changes to the parser, graph, or configuration system

**Non-Goals:**
- Asciidoctor inline macro registration (project moved away from Asciidoctor.js extension API)
- Cross-component linking (items in different Antora components)
- Multi-target syntax (`addresses:REQ-001,REQ-002[]`) — handle as future enhancement

## Decision: In-Memory Source Substitution Before Rendering

**Decision**: Modify the Antora content catalog entries in-memory during `contentClassified`, replacing relationship macro text with Asciidoctor cross-references before the page is rendered by either the HTML or PDF pipeline.

**Where**: `AntoraTraceabilityExtension` — in the `contentClassified` event handler, after the parser extracts relationships but before Asciidoctor renders.

**When**: `contentClassified` fires after the content catalog is populated but before pages are rendered. This is the same event where we currently process items. We add a substitution step after processing.

**How**:

```
contentClassified event
  │
  ├─ Extension finds all .adoc pages in content catalog
  │
  ├─ For each page:
  │    ├─ DocumentParser.process(content) → graph
  │    ├─ For each item in the page:
  │    │    └─ Scan item content for "word:TARGET-ID[]" patterns
  │    │       Replace with Asciidoctor anchor xref
  │    │
  │    └─ Update content catalog entry with modified content
  │         (in-memory only, .adoc file unchanged)
  │
  ▼
Asciidoctor renders modified content
  ├─ HTML: xref → <a href="page.html#REQ-001">REQ-001</a>
  └─ PDF:  xref → internal link to target element
```

**Substitution format**:

Since the target item may be on a different page, we use an Asciidoctor xref with an anchor. When the target item IS on the same page, a fragment-only xref suffices:

- Same page: `xref:#REQ-001[REQ-001]`
- Different page: `xref:requirements.adoc#REQ-001[REQ-001]`

The xref references the item's `id` as an anchor. Asciidoctor needs an anchor for the xref to resolve. Each `[item]` block rendered by Asciidoctor produces a block with `id="REQ-001"` in the HTML. For PDF, Asciidoctor resolves the xref to a page number or internal link.

**Anchor handling**: The `[item]` macro renders as an Asciidoctor block (`====`) which automatically gets an `id` attribute. Asciidoctor treats `xref:#id[...]` as a cross-reference to a block with that id. When the item is on a different page, the xref includes the page path.

If the target item is not in the graph (orphan reference), leave the text unchanged.

**Rationale**:
- Works for both HTML and PDF — source-level transformation is format-agnostic
- No disk writes — modifications are in-memory
- Lightest touch — no new parser, no Asciidoctor extension API, no post-processing
- Uses existing event pipeline (contentClassified already processes content)

**Alternatives Considered**:
- **HTML post-processing** (rejected): Would not work for PDF output. The PDF pipeline has no HTML step to hook into.
- **Asciidoctor inline macro extension**: Cleaner semantics but requires Asciidoctor.js extension API which the project moved away from (manual parsing is simpler and version-independent)
- **Client-side JavaScript**: Doesn't require backend changes but adds JS dependency, breaks without JS, and doesn't work for PDF

## Risks / Trade-offs

**[Risk] Xref resolution failure** — if the target item's page is not in the content catalog or the xref format is wrong, Asciidoctor will log a warning and render the text as-is. Mitigation: test with the example site which has known cross-page references.

**[Risk] Content catalog modification side effects** — modifying content entries in-memory could affect subsequent processing steps. Mitigation: only modify item content within known `[item]` blocks, not arbitrary page content.

**[Risk] Anchor naming** — the item `id` must match the HTML element `id` produced by Asciidoctor. The `[item]` macro's `id` attribute becomes the target of `xref:#id[]`. Verify this mapping is correct.

**[Trade-off] In-memory mutation vs immutability** — the content catalog is modified in-place rather than through a clean transformation pipeline. This is pragmatic: the Antora extension API provides catalog access but not a pure content transformation hook.
