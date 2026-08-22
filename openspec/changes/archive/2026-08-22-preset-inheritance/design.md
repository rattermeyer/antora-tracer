## Context

`ConfigLoader` already supports one direction of inheritance: a user `traceability.yml` declares top-level `extends: <preset>`, and `load()` merges `preset.traceability` under the user config via `mergeConfig(base, override)`.

The other direction — a *preset* extending another *preset* — is half-declared but unimplemented:

- `PresetMetadata.extends?: string` exists with the comment "Parent preset name".
- `TraceabilityConfig.extends?: string` also exists (used by the config-file path).
- `loadPreset(name)` reads the YAML, calls `validatePreset`, caches, and returns — it never reads `extends`.

The merge machinery (`mergeConfig`) is already shared and works on `TraceabilityConfig` objects, so preset-to-preset inheritance is a small addition on top of it.

## Goals / Non-Goals

**Goals:**

- A preset may declare `extends: <parent>` at its top level and inherit the parent's roles, relations, matrices, and inverse labels.
- Identical merge semantics to config-file `extends` (reuse `mergeConfig` unchanged).
- Detect and reject missing parents and inheritance cycles.
- Transitive chains (a → b → c) resolve fully.

**Non-Goals:**

- No multiple inheritance (a single `extends` name only).
- No `extends` inside the `traceability` block for presets — the parent is declared at the preset's top level (metadata), mirroring how a config file declares `extends` at its own top level.
- No changes to the config-file `extends` path or to `mergeConfig` itself.
- No CLI surface or new preset files shipped.

## Decisions

### D1: Parent declared via top-level `extends` (metadata)

The child preset declares `extends: <parent>` as a sibling of `name` / `version` / `description`, i.e. `PresetMetadata.extends`.

Rationale: the field already exists and is annotated "Parent preset name"; it keeps the `traceability` block purely about the model (roles/relations/matrices) rather than embedding an inheritance directive into it. `traceability.extends` in a preset remains ignored, exactly as today.

### D2: Recursive resolution in `loadPreset` with a cycle guard

`loadPreset(name)` becomes:

1. Read + parse the YAML.
2. If `preset.extends` is set, resolve the parent by calling `this.loadPreset(preset.extends)` (recursively) and set `preset.traceability = this.mergeConfig(parent.traceability, preset.traceability)`, then delete `preset.extends`.
3. Validate the merged `traceability`, cache, return.

A module-level or instance `Set<string>` tracks the names currently being resolved along the active chain. Before descending into a parent, if the parent name is already in the set, throw a circular-inheritance error. The set is popped after each frame returns so sibling branches are unaffected. Because the guard runs on names, self-extension and mutual extension are both caught with no depth limit needed.

The existing "Preset '<name>' not found" error from `getPresetPath` covers missing parents for free — the recursive `loadPreset` call throws it naturally.

### D3: Reuse `mergeConfig` unchanged

`mergeConfig(base: TraceabilityConfig, override: CompleteConfig)` already implements the desired semantics: roles union, relations deep-merged with override winning, matrices keyed by `name` (override replaces), `inverseLabels` spread with override winning. Preset inheritance calls it with `base = parent.traceability`, `override = child.traceability`. No change to `mergeConfig`.

`override` is typed `CompleteConfig` but the child's `traceability` is a `TraceabilityConfig`; this is structurally assignable (the only extra field on `CompleteConfig` is optional `metadata`), so no type change is required — if the compiler disagrees, widen the parameter to `TraceabilityConfig`.

### D4: Validate after merge

`validatePreset` currently validates `p.traceability` before caching. The merged result must be validated as a whole (a child alone can be valid yet produce an invalid merge, e.g. a relation referencing a role the child dropped). So validation moves to after parent resolution + merge, operating on the merged `traceability`. The parent is already validated (and cached) independently during its own `loadPreset` call.

### D5: Strip `extends` after resolution

The resolved, cached preset has `extends` removed, so downstream consumers (and `listPresets`) never see a dangling parent reference. This mirrors `load()` deleting `this.config.extends` after merging.

## Risks / Trade-offs

[Cycle guard state] → the in-progress `Set` is per-`ConfigLoader` instance and mutated during recursion. Mitigation: push/pop is symmetric and scoped to `loadPreset`; unit tests cover re-loading the same loader after a cycle error.

[User presets resolving user presets] → `getPresetPath` only finds built-in presets and `cwd/presets/`. A user preset can extend built-ins or sibling cwd presets; that matches the existing lookup surface. No new search locations in this change.

[No depth cap] → the cycle guard makes infinite loops impossible; a long acyclic chain is bounded by the number of preset files on disk, so a numeric depth limit is unnecessary.
