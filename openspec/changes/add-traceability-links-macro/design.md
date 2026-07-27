## Context

The Antora Tracer extension currently replaces inline relationship macros (`addresses:REQ-001[]`) with Asciidoctor xrefs during the `contentClassified` event. Each macro renders as a standalone `xref:target#ID[ID]`. For items with many relationships, this produces repetitive output with no configurability.

The extension already has access to the full traceability graph at `contentClassified` time. The graph can answer "what are all outgoing relationships for item X?", grouped by relation type. A rendering macro can leverage this to produce richer, more compact output.

## Goals / Non-Goals

**Goals:**
- Introduce `traceability:links[]` macro that renders all outgoing relationships for the enclosing item
- Make rendering opt-in via `:traceability-links:` AsciiDoc attribute
- Support configurable display style: `list` (default), `table`, `inline`
- Support configurable sort order: `target-id` (default), `target-title`, `relation-type`
- Generate standard AsciiDoc (not raw HTML) — compatible with HTML and PDF backends
- When enabled, strip individual inline macros from visible output
- Preserve backward compatibility when `:traceability-links:` is not set

**Non-Goals:**
- Rendering INCOMING links (future enhancement)
- Per-macro configuration (only page-level via AsciiDoc attributes)
- Filtering by specific relation types within the macro
- Custom CSS/styling beyond what Asciidoctor provides

## Decisions

### Generate AsciiDoc, not HTML
The macro expands to standard Asciidoctor constructs — section titles, xrefs, lists, tables. This ensures compatibility with HTML and PDF backends identically. The approach mirrors how `substituteRelationshipLinks` already generates xref syntax rather than `<a>` tags.

### Page-level opt-in via AsciiDoc attributes
`:traceability-links: true` enables the feature. This is a standard AsciiDoc document attribute. Attributes are page-level, meaning all items on a page share the same rendering configuration. Per-macro configuration would require a different mechanism and is deferred.

### Strip inline macros when links macro is active
When `:traceability-links: true`, individual `addresses:REQ-001[]` lines are removed from the visible output. The `traceability:links[]` macro is the sole rendered link source. This avoids duplicate information. Without the attribute, inline macros render as before — no change.

### Enclosing item detection via backward scan
To determine which item a `traceability:links[]` belongs to, scan backward from the macro position to find the nearest `[#ID, item, ...]` block macro. This is robust because `[item]` blocks are the only source of these IDs.

### Sort defaults to target ID, configurable
Default ordering by target ID is predictable and stable across builds. Users can override via `:traceability-order: target-title` or `:traceability-order: relation-type`.

## Risks / Trade-offs

**[Risk] Backward scan fails for unusual block layouts** → Mitigation: If no enclosing item is found, emit a warning and skip the macro expansion.

**[Risk] Generated AsciiDoc may conflict with existing page content** → Mitigation: Generated section titles use predefined names (e.g., `.Addresses`). Users can adjust via config if needed.

**[Risk] Performance impact for pages with many items** → Mitigation: Opt-in only. Pages without `:traceability-links:` see zero overhead. Even with it enabled, graph queries are O(1) per item.

**[Risk] AsciiDoc attributes not available in content buffer** → Mitigation: The Antora `file.src.contents` buffer contains the full AsciiDoc source including the document header where attributes are defined. Parse attributes from the header or pass them via Antora's `asciidoc.attributes` in the playbook.

## Open Questions

None. All design decisions have been resolved through exploration.
