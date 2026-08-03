## Why

The existing `sphinx-comparison.adoc` focuses narrowly on traceability tools (Sphinx Needs vs Antora Tracer). Visitors evaluating Antora as a documentation platform need a broader comparison covering the publishing pipeline: HTML output, PDF generation, multi-version support, navigation, and ecosystem fit. This is a separate concern from traceability and belongs on its own page.

## What Changes

- New page: `examples/modules/ROOT/pages/antora-vs-sphinx.adoc` — subjective comparison of Antora and Sphinx as documentation publishing platforms
- Cross-link from `sphinx-comparison.adoc` to the new page
- Add to navigation under a new "Comparisons" heading or near the existing comparison

## Capabilities

No capability changes — documentation only.

## Impact

- **New file**: `examples/modules/ROOT/pages/antora-vs-sphinx.adoc`
- **Modified**: `examples/modules/ROOT/pages/sphinx-comparison.adoc` (cross-link)
- **Modified**: `examples/modules/ROOT/nav.adoc` (navigation entry)
