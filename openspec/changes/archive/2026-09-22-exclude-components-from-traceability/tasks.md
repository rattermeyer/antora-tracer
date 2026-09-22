## 1. Config surface

- [x] 1.1 Add `excludeComponents?: string[]` to `AntoraTraceabilityConfig` in `src/antora-extension.ts`, default it to `[]` in `DEFAULT_CONFIG`, and re-apply it in the constructor's camelCase/lowercase normalization so it survives Antora's key lowercasing. Verify: `npm run build` compiles and the normalized config exposes `excludeComponents`.
- [x] 1.2 Factor the playbook extension-entry lookup out of `loadConfig` into a shared helper (single `require`-match list) so the CLI harvest path can reuse it. Verify: existing config-loading tests still pass via `npm test`.

## 2. Extension filtering

- [x] 2.1 In `registerContentClassifier`, filter `adocFiles` and `adocPartials` immediately after the `.adoc` filter using `!excludeComponents.includes(file.src?.component)`, before `groupByVersion`. Verify: an excluded component produces no items in the graph and no matrix/overview/guidance attachments (extension test).
- [x] 2.2 Add an extension test building a two-component catalog with one excluded: excluded items absent from the graph while the included component is processed in full. Verify: `npm test` passes.

## 3. CLI harvest parity

- [x] 3.1 In `SiteGraph.harvestSiteFiles`, read `excludeComponents` from the playbook's antora-tracer extension entry (reusing the helper from 1.2) and filter harvested files before returning, so CLI callers stay unchanged. Verify: `node examples/run-example.js`-style harvest of a playbook with an excluded component omits its files.
- [x] 3.2 Add a test that harvests a playbook configured with `excludeComponents` and asserts files from the excluded component are absent. Verify: `npm test` passes.

## 4. Hard-exclude semantics

- [x] 4.1 Add a test asserting that a relationship macro in an included document targeting an item defined only in an excluded component is stored pending target and reported with a "Target item not found" warning, with no stub item created. Verify: `npm test` passes.

## 5. Documentation

- [x] 5.1 Document `excludeComponents` in `reference/configuration.adoc` alongside the sibling extension options, and note the hard-exclude pending-target behavior in `reference/traceability-macros.adoc` and the harvest parity in `reference/cli.adoc`. Verify: `npx antora antora-playbook.yml` builds and Vale passes.

## 6. Final verification

- [x] 6.1 Run `npm test` and `npm run lint`; confirm the full suite (extension + CLI + graph) is green. Verify: both commands exit 0.
