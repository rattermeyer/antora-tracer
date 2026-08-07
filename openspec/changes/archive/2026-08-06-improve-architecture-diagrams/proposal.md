## Why

The architecture document has four PlantUML diagrams (component, sequence, activity, config resolution) but misses diagrams for the most complex individual concepts: the DocumentParser's multi-step regex pipeline, the TraceabilityGraph's lifecycle states, the PreparedFile caching flow added in `cache-file-processing-state`, and the public API contracts between components. The `update-example-site` skill has minimal diagram guidance — it mentions updating existing diagrams but gives no checklist, no guidance on when to add new diagram types, and no mapping of diagram types to arc42 sections.

## What Changes

- Add four new PlantUML diagrams to the example site's architecture document:
  - **Class/API diagram**: key interfaces and their method signatures (TraceabilityGraph, DocumentParser, ConfigLoader, MatrixGenerator, LinkResolver)
  - **DocumentParser activity diagram**: step-by-step regex parsing flow (verbatim exclusion → item extraction → body scanning → old-macro detection)
  - **TraceabilityGraph state diagram**: lifecycle from Empty → Populated → Complete → Queried
  - **PreparedFile caching activity diagram**: single preparation feeding five macro-expansion passes
- Update the `update-example-site` skill (section 4 — architecture) with:
  - Diagram checklist per arc42 section
  - Guidance on when to add each diagram type (class, sequence, activity, state)
  - Placement conventions (inline vs. partial files)

## Capabilities

### New Capabilities

- `architecture-diagram-checklist`: The architecture document SHALL include a defined set of diagrams covering component structure, runtime behavior, internal component logic, and state lifecycles. The `update-example-site` skill SHALL provide explicit guidance on maintaining and extending this diagram set.

### Modified Capabilities

None — no code or user-facing behavior changes.

## Impact

- `examples/component-one/modules/ROOT/pages/architecture.adoc` — new diagram includes and ARC items
- `examples/component-one/modules/ROOT/examples/` — 4 new `.puml` files
- `.pi/skills/update-example-site/SKILL.md` — expanded architecture section with diagram guidance
