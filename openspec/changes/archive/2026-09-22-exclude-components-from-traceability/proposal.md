## Why

An Antora site can pull content from many sources, and not all of it belongs in the traceability graph. Today the extension processes every `.adoc` page and partial across every component, so docs from an unrelated project (pulled in as a content source) get parsed into the graph, rewritten by relation macros, and registered with generated matrices and overview attachments.

## What Changes

- Add an `excludeComponents: string[]` option to the extension config (`antora.extensions[].config`), holding exact Antora component names.
- Filter excluded components out of the traceability graph at the single choke point in `contentClassified`: they are neither parsed into the graph nor macro-expanded nor given generated attachments.
- Apply the same exclusion to the CLI when it harvests a playbook (`export neo4j`, `seed`, `site-graph` via `SiteGraph.harvestSiteFiles`), so the graph produced from a playbook matches the graph the build produces.
- Hard-exclude semantics: an excluded component's items never enter the graph, and relationship macros authored in *included* docs that point into an excluded component remain "pending target" warnings (unchanged behavior).
- Document the new option in the extension configuration reference and note the behavior in the traceability macros and CLI references.

## Capabilities

### New Capabilities

- `exclude-components`: Scope traceability to a denylist of Antora component names, applied consistently in the Antora build and in CLI playbook harvesting.

### Modified Capabilities

<!-- No existing capability's requirements change. -->

## Impact

- `src/antora-extension.ts` — `AntoraTraceabilityConfig` gains `excludeComponents`; `registerContentClassifier` filters `adocFiles`/`adocPartials` before version grouping.
- `src/SiteGraph.ts` and `src/cli.ts` — playbook harvest paths read `excludeComponents` from the playbook's extension entry and filter harvested files.
- `examples/tracer/modules/ROOT/pages/reference/configuration.adoc`, `reference/cli.adoc`, `reference/traceability-macros.adoc` — document the option and the hard-exclude behavior.
- Tests — extension build excludes a component; CLI playbook harvest excludes a component; included→excluded references stay pending-target.
