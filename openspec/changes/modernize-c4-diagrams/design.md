## Context

See `proposal.md` for motivation and scope.
The three C4 sources use PlantUML's bundled `<C4/...>` macros and render through Antora/Kroki.

## Goals / Non-Goals

**Goals:**
- Apply one consistent modern C4 style to the three architecture diagrams.
- Preserve current C4 macro versions, diagram content, and rendering pipeline.

**Non-Goals:**
- Change diagram semantics, element labels, relationships, or layout.
- Change Kroki configuration or add external theme files/dependencies.

## Decisions

- Set `!NEW_C4_STYLE=1` before each existing C4 standard-library include. The current C4 library already implements the rounded wireframe appearance, so this avoids vendoring a theme, remote fetches, and theme/macro version skew.
- Keep the existing `<C4/C4_...>` includes so element definitions remain supplied by the current standard library.
- Leave color configuration untouched. The three diagrams define no custom C4 colors; custom `$bgColor`/`$fontColor` tags would require review because the flag swaps their meanings.

## Risks / Trade-offs

- Future custom C4 color tags may render differently under the flag → document the caveat and recheck custom tags if they are introduced.
- Rendering follows the C4 implementation bundled by the current PlantUML/Kroki runtime → inspect all three diagrams in the normal Antora build.

## Migration Plan

No data migration is needed; the change is diagram-source-only.
Rollback by removing the flag lines and restoring the architecture prose.
