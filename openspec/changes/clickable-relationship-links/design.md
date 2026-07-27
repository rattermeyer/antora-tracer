# Design: Clickable Relationship Links

## Context

The `DocumentParser` extracts inline relationship macros (`addresses:REQ-001[]`) from `[item]` block content and stores them as `ItemRelationship` objects in the `TraceabilityGraph`. Asciidoctor renders the macro text as-is — it has no knowledge of the traceability graph. The result is plain text in the HTML output.

We need to bridge the gap: make the rendered text clickable without modifying Asciidoctor's rendering pipeline.

## Goals / Non-Goals

**Goals:**
- Render `<relation-type>:<TARGET-ID>[]` as clickable links in Antora page HTML
- Links navigate to the target item's source page with an anchor id
- Work within the existing Antora extension event pipeline
- No changes to the parser, graph, or configuration system

**Non-Goals:**
- Asciidoctor inline macro registration (project moved away from Asciidoctor.js extension API)
- Multi-target syntax (`addresses:REQ-001,REQ-002[]`) — handle as future enhancement
- Cross-component linking (items in different Antora components)
- Styling the links (leave to the UI theme)

## Decision: HTML Post-Processing in Page Processor

**Decision**: After Asciidoctor renders each `.adoc` page to HTML, regex-replace relationship text patterns with anchor links using data from the `TraceabilityGraph`.

**Where**: `AntoraTraceabilityExtension.registerPageProcessor()` — this is the existing hook that runs after page rendering.

**When**: After the page is rendered but before it's written to the site output. The `contentClassified` event has already populated the graph with items and their `sourceFile` paths, so the data is available.

**How**:

```
Page render pipeline:
  AsciiDoc content
    → Asciidoctor renders to HTML
    → Page processor hook
      → Post-process HTML: regex replace relationship patterns with <a> links
    → Final HTML written to output
```

**Regex pattern to match**: `/addresses:([A-Z]+-\d+)\[\]/g` — captures the relation type and target ID. Generalized: `/(\w+):([A-Za-z]+[-.\w]*)\[\]/g`

**Replacement**: Look up the target item in the graph via `graph.getItem(targetId)`. If found and has a `sourceFile`, construct a relative URL: `<sourceFile-without-.adoc>.html#<targetId>`. If not found (orphan reference), leave the text unchanged.

**Link HTML**:
```html
<a href="requirements.html#REQ-001" class="traceability-link">REQ-001</a>
```

The `<em>` tags Asciidoctor wraps around the relation type text are preserved; only the `TARGET-ID[]` portion becomes a link.

**Rationale**:
- Lightest touch — no new parser, no Asciidoctor extension API
- Works within existing event pipeline
- Graph data is already available (populated by `contentClassified` before page processing)
- Fallback safe: if a target can't be resolved, text is left unchanged

**Alternatives Considered**:
- **Asciidoctor inline macro extension**: Cleaner semantics but requires Asciidoctor.js extension API which the project deliberately moved away from (manual parsing is simpler and version-independent)
- **DocumentParser pre-processing**: Replace macros with AsciiDoc xrefs before Asciidoctor renders. Requires knowing page-to-item mappings at parse time and modifying item content before rendering
- **Client-side JavaScript**: Doesn't require backend changes but adds JS dependency and breaks without JS enabled

## Risks / Trade-offs

**[Risk] Regex false positives** — a user might write `addresses:XYZ-001[]` in a paragraph that isn't a traceability item. Mitigation: only post-process within `[item]` blocks. The page processor can target item content specifically.

**[Risk] Source file path resolution** — the `sourceFile` field contains the file path as recorded during processing. In Antora, this might be a virtual path that needs mapping to an output URL. Mitigation: use the page's component context to construct the correct URL.

**[Trade-off] Post-processing vs inline macro** — Post-processing is simpler but less semantically clean than a real Asciidoctor inline macro. The trade-off is pragmatic: we get working links without depending on Asciidoctor.js extension API.
