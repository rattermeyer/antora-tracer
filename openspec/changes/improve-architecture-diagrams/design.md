## Context

The example site's `architecture.adoc` currently has four PlantUML diagrams:
- `bb-overview.puml` — component dependency diagram (Building Block View)
- `sequence-diagram.puml` — Antora build processing sequence (Runtime View)
- `pass-pipeline.puml` — contentClassified pass ordering (Runtime View)
- `config-resolution.puml` — configuration loading chain (Building Block View)

Missing are diagrams for the most architecturally significant concepts that are currently described only in prose:
1. The public API contracts between components (what methods each exposes)
2. The DocumentParser's multi-step regex pipeline (the most complex single algorithm)
3. The TraceabilityGraph's state lifecycle (critical for understanding pass ordering)
4. The PreparedFile caching flow (a cross-cutting optimization that affects five methods)

The `update-example-site` skill's architecture section currently says "Update the PlantUML component diagram" and "Update the runtime sequence diagram" — but has no checklist of expected diagrams, no guidance on diagram types, and no conventions for placement.

## Goals / Non-Goals

**Goals:**
- Add four PlantUML diagrams covering the identified gaps
- Update the skill with a diagram checklist and type guidance
- Keep diagrams in the existing `examples/` directory pattern
- Use existing ARC items or add new ones as needed for traceability

**Non-Goals:**
- Changing existing diagrams (they're accurate)
- Converting diagrams to a different format (staying with PlantUML/Kroki)
- Adding diagrams to other example site pages

## Decisions

### Decision 1: One class diagram covering all key interfaces

Rather than one diagram per component, a single `api-overview.puml` shows all key interfaces and their public methods. This follows the existing pattern (`bb-overview.puml` already shows all components in one diagram).

**Components shown:** TraceabilityGraph, DocumentParser, ConfigLoader, MatrixGenerator, LinkResolver, TemplateRenderer, Neo4jExporter, RequirementsTraceabilityExtension

**Format:** PlantUML class diagram with method signatures, grouped by package.

### Decision 2: Activity diagrams for internal component logic

Two activity diagrams document the most complex internal flows:

- `parser-flow.puml` — DocumentParser's step-by-step pipeline: pre-scan verbatim blocks → find `[#ID, item,...]` with quote-aware bracket matching → locate `--` delimiters → extract body content → scan for `relation:TARGET[]` macros skipping inline-code ranges → check for old macros → return ParserResult
- `prepared-file-caching.puml` — shows `prepareFile()` computing content/docAttrs/blocks once, then feeding all five expand methods

**Rationale:** Activity diagrams are ideal for sequential algorithm descriptions. Both of these concepts are currently described in 10+ lines of dense prose that would benefit from visual representation.

### Decision 3: State diagram for TraceabilityGraph lifecycle

`graph-lifecycle.puml` — states: Empty → Populated (items added) → Complete (relationships added) → Validated (after validate() call). Shows which operations are valid in each state and what transitions between them.

**Rationale:** The graph's state is implicit in the pass ordering (Pass 1 populates, Pass 3 queries) but never explicitly documented. A state diagram makes the lifecycle constraints visible.

### Decision 4: Diagram placement in existing examples directory

All new diagrams go in `examples/component-one/modules/ROOT/examples/` alongside the four existing `.puml` files. They are included in `architecture.adoc` via `include::example$filename.puml[]` inside the appropriate ARC item blocks.

### Decision 5: Skill diagram checklist by arc42 section

The skill update adds a table mapping arc42 sections to expected diagram types:

| arc42 Section | Expected Diagrams | When to Update |
|---|---|---|
| Building Block View | Component diagram, Class/API diagram, Config resolution | New components added or interfaces change |
| Runtime View | Sequence diagram (Antora flow), Pass pipeline activity, Parser flow activity, PreparedFile caching activity | Processing flow or internal algorithms change |
| Architecture Decisions | (none — text table) | New ADR added |

And a decision guide:

| Concept Type | Diagram Type | Example |
|---|---|---|
| Who depends on whom | Component | bb-overview |
| What they expose | Class/API | api-overview |
| What happens in what order | Sequence | sequence-diagram |
| How a component works internally | Activity | parser-flow |
| What states something has | State | graph-lifecycle |
| How data/config flows | Flow/Activity | config-resolution |

## Risks / Trade-offs

- **[Risk] Diagrams drift from code**: PlantUML is not generated from code, so method signatures in the class diagram can become stale. → **Mitigation**: The skill explicitly calls out updating the class diagram when interfaces change. The diagram shows public API only (stable), not internal methods.
- **[Risk] Too many diagrams overwhelm readers**: Seven diagrams in one document. → **Mitigation**: Diagrams are placed inline with their corresponding concept descriptions, not in a separate "diagram gallery." Each diagram is introduced by the prose that explains it.
