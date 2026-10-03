## Why

The architecture page's three C4 diagrams use the older filled-box default, while C4-PlantUML now provides a wireframe-oriented `C4_blue_new` theme that better matches current C4 visuals.
The diagrams should share the updated style while retaining their existing standard-library macros, content, and rendering pipeline.

## What Changes

- Enable `!NEW_C4_STYLE=1` before the bundled C4 includes in the context, container, and component diagrams.
- Retain the existing C4 standard-library macros and diagram content.
- Document the style flag and its effect in the architecture page.

## Capabilities

### New Capabilities
- `c4-diagram-styling`: Defines the visual theme and source compatibility for the architecture page's C4 diagrams.

### Modified Capabilities
None.

## Impact

- Three C4 diagram source files and the architecture documentation.
- PlantUML rendering through the existing Antora/Kroki documentation build.
