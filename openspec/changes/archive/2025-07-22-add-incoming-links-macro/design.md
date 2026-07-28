## Context

The `traceability:links[]` macro (introduced in the `traceability-links-macro` capability) renders outgoing relationships inside an item block. The name `links[]` is ambiguous — it doesn't distinguish direction. The underlying `TraceabilityGraph` already has `getReverseRelationships(targetId)` for incoming queries, used by `MatrixGenerator` and impact analysis but never exposed as a rendering macro.

This change renames the existing macro to `traceability:outgoing[]` and adds a companion `traceability:incoming[]`. Both consume the same graph, use the same style/sort attributes, and are gated by the same `:traceability-links:` attribute. The implementation lives entirely in `AntoraTraceabilityExtension` — no graph, parser, matrix, or export changes needed.

## Goals / Non-Goals

**Goals:**
- Rename `traceability:links[]` → `traceability:outgoing[]` everywhere
- Add `traceability:incoming[]` that renders reverse relationships with inverse labels
- Both macros share `:traceability-links:`, `:traceability-style:`, `:traceability-order:` attributes
- Both macros can coexist in the same item block
- Handle user-defined relation types not in `INVERSE_MAP` gracefully (display raw type name)

**Non-Goals:**
- Separate document attribute gates for outgoing vs incoming
- Configurable inverse labels (beyond existing `INVERSE_MAP`)
- Changes to matrix generation, Neo4j export, or graph data model
- New display styles beyond list/table/inline

## Decisions

### Decision 1: Separate macro names (`outgoing[]` / `incoming[]`) rather than a unified `links[direction=...]` with argument parsing

**Rationale**: Argument parsing adds complexity (regex, validation, error messages) for two options. Separate macros are self-documenting, zero-ambiguity, and follow the precedent of AsciiDoc block macros having static names. Users can place both in the same block — they expand independently. If a unified syntax is ever needed, the standalone names remain as aliases.

### Decision 2: Inverse labels via existing `INVERSE_MAP`, fallback to raw type name

**Rationale**: The `INVERSE_MAP` already maps `addresses` → `addressed-by`, `implements` → `implemented-by`, etc. For the incoming macro, we look up `rel.type` in `INVERSE_MAP` to get the display label. If the type is not in the map (user-defined relations), we display the raw type name capitalized — same as the outgoing macro does. This is consistent and requires no config changes.

Example display for a user-defined `audits` relation:
- Outgoing: `.Audits` (raw)
- Incoming: `.Audits` (raw, no inverse)

This is slightly awkward for incoming ("Audits: ITEM-001" rather than "Audited by: ITEM-001") but requires no configuration surface. Future work could add a `:traceability-inverse-map:` config.

### Decision 3: Share `:traceability-links:` gate for both macros

The document attribute `:traceability-links:` currently gates only the outgoing macro. We keep it as a single gate for both. Adding separate `:traceability-outgoing:` and `:traceability-incoming:` attributes would increase configuration surface without clear user demand. Users who want to show one direction but not the other can simply not include the unwanted macro.

Naming note: `:traceability-links:` (the attribute name) now differs from the macro names (`outgoing`, `incoming`). This is acceptable because the attribute appears only in the document header, not visible in rendered output. Renaming the attribute would be a second breaking change with marginal benefit.

### Decision 4: Implement as a parallel method, not a unified engine

The existing `expandLinksMacros` method (renamed to `expandOutgoingMacros`) and a new `expandIncomingMacros` will share the same Pass 2 loop but be separate methods. They differ in:
- The regex pattern matched
- The graph query (`getRelationships` vs `getReverseRelationships`)
- Label transformation (none vs `INVERSE_MAP` lookup)
- Internal bookkeeping (`itemsWithLinksMacro` set — rename to cover both)

Refactoring into a unified macro expander with a direction parameter would be cleaner long-term but adds risk for a pre-1.0 change. The parallel approach is simpler to reason about and test independently.

## Risks / Trade-offs

- **Risk**: User-defined relation types without inverse mapping display awkwardly for incoming links → Mitigation: Document the behavior; add inverse-map config in a future change if users request it
- **Risk**: Users with `traceability:links[]` in their `.adoc` files get broken output after upgrade → Mitigation: This is a pre-1.0 breaking change, documented in changelog. The rename is mechanical — users find-and-replace `traceability:links[]` → `traceability:outgoing[]`
- **Risk**: Performance — scanning content twice for two different macros in Pass 2 → Mitigation: Both macros are matched with simple regexes; the content is already in memory. The overhead is negligible compared to Antora's overall page processing time
- **Trade-off**: Keeping `:traceability-links:` as the attribute name when macro names are now `outgoing`/`incoming` → Acceptable mismatch; the attribute is header-only
