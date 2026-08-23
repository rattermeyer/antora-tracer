## Why

Supersession creates two review needs that nothing in the current output answers: how much of the graph is superseded at a glance, and which links are left dangling after a superseded item is removed. A single generated overview page answers both, and a display-only render toggle lets teams suppress superseded noise without touching the graph.

## What Changes

- When configured, the extension generates an overview page at a target `component:module:page`.
- The page reports graph totals (managed, active, superseded) and a per-role table (`role`, `total`, `active`, `superseded`).
- The page lists dangling references: the source item (as xref), the relation type, and the missing target ID.
- Add a display-only `renderSuperseded` toggle: when off, superseded item blocks and their `supersedes`-related links are omitted from rendered output (graph and matrices are unaffected).
- Dangling *history* links (`supersedes`/`superseded_by`) become advisory worklist items rather than validation errors; dangling *functional* links remain errors.

## Capabilities

### New Capabilities

- `supersession-overview`: a generated page reporting supersession statistics and dangling references.

### Modified Capabilities

- `traceable-item-supersession`: display-only render toggle for superseded items and links; dangling history links are advisory.

## Impact

- `src/antora-extension.ts` — overview page generation at `sitePublished`; render toggle in the content pass
- `src/TraceabilityGraph.ts` — `getDanglingReferences()`, active/superseded counts, history-vs-functional dangling classification
- `src/config/TraceabilityConfig.ts` — new config keys
- Docs: `reference/configuration.adoc`, `how-to/visualizations.adoc`, `reference/traceability-macros.adoc`
