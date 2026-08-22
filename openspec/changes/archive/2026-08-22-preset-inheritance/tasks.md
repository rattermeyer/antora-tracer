## 1. Implementation

- [x] 1.1 In `src/config/TraceabilityConfig.ts`, modify `loadPreset()` to resolve a top-level `extends` field: recursively load the parent, merge with `mergeConfig(parent.traceability, preset.traceability)`, and delete `preset.extends` after merging
- [x] 1.2 Add a cycle guard (an in-progress name `Set` on `ConfigLoader`, pushed/popped around parent resolution) that throws a circular-inheritance error on self or mutual extension
- [x] 1.3 Move `validatePreset`'s config validation to after parent resolution + merge so the merged `traceability` is validated as a whole
- [x] 1.4 Widen `mergeConfig`'s `override` parameter to `TraceabilityConfig` if the compiler requires it (structurally assignable otherwise)

## 2. Tests

- [x] 2.1 `test/config-loader.test.ts`: a preset extending a built-in inherits the parent's roles and relations
- [x] 2.2 Child role/relation/matrix/inverseLabel overrides the parent's on conflict
- [x] 2.3 A child matrix with a new `name` is added alongside the parent's matrices; a same-name matrix is replaced
- [x] 2.4 Transitive chain (a → b → c) includes the full chain's roles
- [x] 2.5 Missing parent throws an error naming the missing preset
- [x] 2.6 Self-extension and mutual extension (a ↔ b) throw a circular-inheritance error

## 3. Documentation

- [x] 3.1 `examples/tracer/modules/ROOT/pages/reference/presets.adoc` — document the preset-level `extends` field
- [x] 3.2 `examples/tracer/modules/ROOT/pages/how-to/custom-domain-model.adoc` — add a section on extending a preset from another preset
- [x] 3.3 `examples/tracer/modules/ROOT/pages/reference/configuration.adoc` — note the preset-level `extends` alongside the config-file `extends`
- [x] 3.4 Rebuild the example site (`npx antora antora-playbook.yml`) and regenerate matrices (`node examples/run-example.js`) to verify self-traceability still passes
