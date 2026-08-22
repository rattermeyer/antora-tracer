## Why

The `extends` field on a preset is typed and documented as "Parent preset name" (`PresetMetadata.extends`) but never read — `ConfigLoader.loadPreset()` parses, validates, caches, and returns the raw YAML without inspecting it.
Users who want a preset that builds on `requirements-engineering` (add one role, tweak two relations) must copy the entire preset and keep it in sync by hand, which drifts.

## What Changes

- **Preset-to-preset inheritance** — a preset may declare `extends: <parent>` at its top level (sibling of `name`, `version`, `description`). `loadPreset()` recursively loads the parent and deep-merges the parent's `traceability` under the child's.
- **Same merge semantics as config-file `extends`** — roles union, relations deep-merged, matrices overridden by name, `inverseLabels` overridden. Child wins on conflict.
- **Circular-inheritance guard** — a preset extending itself, or a chain that loops (a → b → a), is rejected with a clear error.
- **Missing-parent error** — extending a preset that cannot be resolved fails with the existing "Preset '<name>' not found" error.
- **Documentation** — `reference/presets.adoc` and `how-to/custom-domain-model.adoc` describe the `extends` field for presets.

## Capabilities

### New Capabilities

- `preset-inheritance`: a built-in or user preset can extend another preset; the parent's roles, relations, matrices, and inverse labels are deep-merged under the child, with cycle and missing-parent detection.

### Modified Capabilities

<!-- none -->

## Impact

- `src/config/TraceabilityConfig.ts` — `loadPreset()` gains recursive parent resolution + a cycle guard; `Preset.extends` is consumed and stripped after merge.
- `test/config-loader.test.ts` — new unit tests for merge, override, transitive chains, missing parent, and cycles.
- `examples/tracer/modules/ROOT/pages/reference/presets.adoc` — document the `extends` field.
- `examples/tracer/modules/ROOT/pages/how-to/custom-domain-model.adoc` — extend-preset instructions.
- `examples/tracer/modules/ROOT/pages/reference/configuration.adoc` — note the preset-level `extends` alongside the existing config-file `extends`.
- No new dependencies. No breaking changes: existing presets have no `extends` field, so their behavior is unchanged.
