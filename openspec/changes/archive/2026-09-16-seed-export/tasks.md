## 1. Graph

- [x] 1.1 Add `TraceabilityGraph.getPrefixMaxima()` returning `Map<prefix, { start: number; width: number }>` with `start = max+1`; verify a unit test reports `REQ → 55` for `REQ-054` and omits empty prefixes
- [x] 1.2 Ensure the reduction is numeric (not a formatted string) and deduplicates by item ID; verify a test covers multiple prefixes

## 2. CLI

- [x] 2.1 Add a `seed` command with `-i <dir>` and playbook-positional modes, reusing `harvestSiteFiles` for playbook mode; verify `npm run build` compiles
- [x] 2.2 Emit a `prefixes:` YAML map with numeric `start` (and `width` when known) to `-o <file>` or stdout; verify the output matches the id-server config shape
- [x] 2.3 Return an error when neither `-i` nor a playbook is provided; verify the error case

## 3. Tests

- [x] 3.1 Test local-directory mode produces max+1 seeds for multiple prefixes
- [x] 3.2 Test playbook mode spans components and deduplicates versions (same ID in two versions contributes once)
- [x] 3.3 Test the emitted YAML is parseable and matches the id-server `prefixes` shape

## 4. Docs

- [x] 4.1 Document `seed` in `reference/cli.adoc` and the seed workflow in `how-to/run-id-server.adoc`; verify the Antora site still builds
