## Why

The six built-in presets expose 34 distinct roles, but authoring guidance exists for only eight, and some existing pages are too terse or contain stale assumptions. Teams using the Agile and IEC 62304 presets therefore have to invent item formats and guidance without help from the preset.

## What Changes

- Add concise, role-specific authoring guidance for every role in every built-in preset, reusing shared guidance where roles share semantics.
- Improve existing guidance where templates, link direction, lifecycle, or quality rules are missing or misleading.
- Wire each preset role to applicable guidance and an ID prefix only where the project's existing convention supports one.
- Keep domain guidance grounded in the relation model and avoid implying regulatory compliance solely from using a preset.

## Capabilities

### New Capabilities

### Modified Capabilities
- `role-guidance`: Built-in presets provide usable authoring guidance for every declared role, aligned with each role's configured relationships and conventions.

## Impact

- `src/presets/guidance/*.adoc`
- `src/presets/*.yml`
- `test/role-guidance.test.ts`
