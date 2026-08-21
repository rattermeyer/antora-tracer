## 1. Config DOT generator

- [x] 1.1 Extract `ROLE_COLORS` to a shared exported constant and update `TraceabilityGraph` to import it (remove the private static)
- [x] 1.2 Add `toConfigDot(config)` to `src/config/TraceabilityConfig.ts`: nodes from `config.roles`, edges from `config.relations` (declared directions only), self-loops preserved, isolated roles rendered as nodes

## 2. Macro expansion

- [x] 2.1 Add `expandConfigGraphMacros` to `src/antora-extension.ts` handling global `traceability:config-graph[]`, gated by `:traceability-graph:`, stripped when no config is loaded
- [x] 2.2 Wire `expandConfigGraphMacros` into the content processing pipeline alongside `expandGraphMacros` / `expandCoverageMacros`

## 3. Tests

- [x] 3.1 Unit tests for `toConfigDot`: nodes for every role, edge per declared relation with type labels, self-loop, isolated role node, no `inverseLabels`-derived edges, multiple relation types on one edge
- [x] 3.2 Macro tests: expands to a Kroki image when `:traceability-graph:` is set; stripped when the attribute is absent; stripped when config is unavailable

## 4. Documentation

- [x] 4.1 Add `explanation/our-traceability-model.adoc` with `traceability:config-graph[]` and hand-written meanings for each role and relation of this project's model
- [x] 4.2 Add the page to `nav.adoc` under Explanation and cross-link it from `traceability-model.adoc`
- [x] 4.3 Document `traceability:config-graph[]` in `how-to/visualizations.adoc`
- [x] 4.4 Rebuild the example site (`npx antora antora-playbook.yml`) and regenerate matrices to verify self-traceability still passes
