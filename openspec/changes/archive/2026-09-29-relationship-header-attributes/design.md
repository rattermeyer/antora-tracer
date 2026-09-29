## Context

See `proposal.md` for motivation and the capability spec for the observable contract.

`DocumentParser.parseItemMacros` already parses header attributes into a `Record<string, string>`, then strips reserved keys (`id`, `role`, `title`, `status`) and stores the rest in `Item.attributes`. Relationships are extracted separately from block bodies by `parseInlineMacrosFromItems`. `TraceabilityGraph.addRelationship` already canonicalizes reverse-authored edges and warns on duplicate canonical edges; `validate` promotes those warnings to errors.

## Goals / Non-Goals

**Goals:**
- Add relation-name header attributes as a second way to author the same relationships.
- Reuse the existing relationship shape, canonicalization, validation, and duplicate handling.
- Keep header parsing quote-aware so comma-separated target lists work.

**Non-Goals:**
- Change inline macro syntax, rendering, or graph semantics.
- Introduce a new grammar for arbitrary attributes; only configured relation names become relationships.

## Decisions

### Detect relation names through configuration
Add a `ConfigLoader` lookup that reports whether a name is any configured relation type (primary or reverse). `parseItemMacros` consults it for each header attribute key; recognized keys produce relationships and are removed from `Item.attributes`. Unrecognized keys remain metadata.

Alternative: treat every attribute value that looks like an ID list as relationships. Rejected because it would hijack custom metadata and break the existing Neo4j node-property export.

### Split target lists on commas and whitespace
After quote removal, split the attribute value on commas and/or whitespace, dropping empty segments. This accepts both `"REQ-222, QA-056, QA-057"` and `"REQ-222 QA-056 QA-057"`. Quoting is required for comma-separated lists so `splitAttributes` does not treat each target as a separate attribute.

Alternative: commas only. Rejected because the request explicitly asks for whitespace-separated support and the inline macro already supports comma-separated lists.

### Emit the same relationship records as inline macros
For each target of a recognized attribute, push an `ItemRelationship` using the item's ID, the attribute name as type, the header line as source line, and the existing `id`-derived relationship key. This feeds the same `addRelationship` path, so reverse canonicalization, validation, and duplicate warnings apply unchanged.

## Risks / Trade-offs

- A custom attribute that happens to share a relation name silently becomes a relationship → mitigate by documenting that configured relation names are reserved as header attributes.
- Duplicate authoring across header and inline syntaxes yields a warning/error → intended, surfaced through existing graph validation.

## Migration Plan

No migration required. Inline macros remain valid. New header attributes are additive. Rollback is to stop using the attribute form.
