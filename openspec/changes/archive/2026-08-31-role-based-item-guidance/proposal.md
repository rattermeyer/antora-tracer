## Why

Item-writing guidance for the agent currently lives hardcoded in two skills (`requirements-writing`, `use-case-engineering`) and re-discovers the project's model by grepping `.adoc` files. A project that defines a custom role gets no authoring guidance, and the role guidance cannot be customized per project. Making role guidance data — config + AsciiDoc pages — lets projects customize it, ships sensible defaults, and renders it as human-facing documentation.

## What Changes

- Add a `traceability.roleGuidance` config section: per role, a `page` (an AsciiDoc page describing how to write that role's items) and an `idPrefix` (a fallback, not an authority).
- Ship default guidance pages with the presets (e.g. `requirement` → EARS guidance, `use_case` → Karl Wiegers guidance, `design`, `test`).
- Add a `role-guidance <role>` CLI command that resolves the guidance through the preset `extends` chain and outputs the resolved page and `idPrefix`.
- Register the resolved guidance pages into the content catalog at build time so they render in the consuming site (same mechanism as generated matrices).
- Add a `write-item` skill that consumes the resolved guidance; the existing `requirements-writing` and `use-case-engineering` content becomes the shipped default guidance pages for `requirement` and `use_case`.

## Capabilities

### New Capabilities

- `role-guidance`: Per-role authoring guidance (AsciiDoc page + idPrefix) declared in the traceability config, shipped as preset defaults, resolvable via CLI, and rendered into the site.

### Modified Capabilities

<!-- none -->

## Impact

- **Config**: `src/config/TraceabilityConfig.ts` — new `roleGuidance` type, parsing, and `extends` merge.
- **Presets**: `src/presets/` — default guidance `.adoc` pages shipped alongside presets.
- **CLI**: `src/cli.ts` — new `role-guidance` command.
- **Extension**: `src/antora-extension.ts` — register resolved guidance pages into the content catalog during the build.
- **Skills**: new `write-item` skill; `requirements-writing` / `use-case-engineering` content becomes default guidance pages.
- **Distribution**: npm `files` must include the guidance pages.
- **Docs**: reference and how-to pages for the new config section and CLI command; example site rendered guidance pages.
