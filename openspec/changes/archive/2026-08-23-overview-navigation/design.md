## Context

The overview is generated HTML, so it cannot become a converted AsciiDoc page. The matrices already solve the same problem: they are registered as content-catalog attachments during `contentClassified`, making `xref:attachment$traceability/matrix-*.html[]` resolve and appear in the nav.

## Goals / Non-Goals

**Goals:**
- Make the overview navigable from the site nav.
- Honour a configurable placement.

**Non-Goals:**
- No change to the `sitePublished` standalone dashboard output (the overview file there stays).
- No converted AsciiDoc page.

## Decisions

1. **Register the overview as an attachment** — generated after the per-version loop (the full graph is complete there), under every module of every component version at `overviewTarget` (default `traceability/overview.html`), mirroring the matrix registration.
2. **`overviewTarget` is the attachment relative path**, not a full `component:module:page` — the component/module is "every module", exactly like matrices.
3. **Nav entry** points at `xref:attachment$traceability/overview.html[]`.

## Risks / Trade-offs

- [Duplicate content] → the same overview HTML is registered under each module; harmless and consistent with matrices.
- [Config drift] → the spec's old `component:module:page` wording is updated to the attachment-path reality.
