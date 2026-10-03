# C4 Diagram Styling

## Purpose

Defines the shared C4 appearance used by the architecture page's context, container, and component diagrams, with a pinned local theme so builds remain reproducible and offline-capable.

## Requirements

### Requirement: Architecture C4 diagrams use the modern C4 style
The architecture documentation SHALL render its C4 context, container, and component diagrams with C4-PlantUML's `!NEW_C4_STYLE=1` setting enabled before the bundled C4 macros are loaded.

#### Scenario: Build the architecture page
- **WHEN** the architecture page renders any of its three C4 diagrams
- **THEN** the diagram SHALL use the modern rounded wireframe visual style
- **AND** each diagram SHALL retain its existing C4 elements, relationships, labels, and legend

#### Scenario: Preserve bundled C4 macro loading
- **WHEN** a diagram loads its bundled C4 standard-library macros
- **THEN** `!NEW_C4_STYLE=1` SHALL already be set
- **AND** the diagram SHALL NOT require a remote theme file
