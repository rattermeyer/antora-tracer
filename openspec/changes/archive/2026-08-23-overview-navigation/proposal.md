## Why

The supersession overview is generated at `sitePublished` as a standalone file in the output directory — it is not a navigable site artifact and has no nav entry. The original design (configurable `component:module:page` target) was deferred as an open question; the spec still promises a target the code doesn't provide.

## What Changes

- Register the overview as a content-catalog **attachment** (like the matrices) during `contentClassified`, after the full graph is complete, so `xref:attachment$…` and nav entries resolve.
- Add an `overviewTarget` config (default `traceability/overview.html`) for the attachment relative path.
- Add a nav item to the Traceability section.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `supersession-overview`: the "overview target" requirement now reflects attachment registration.

## Impact

- `src/antora-extension.ts` — register the overview as an attachment
- `examples/tracer/modules/ROOT/nav.adoc` — nav item
- `reference/configuration.adoc`, `how-to/visualizations.adoc`
