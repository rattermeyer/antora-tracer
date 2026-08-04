## Context

`expandOutgoingMacros` and `expandIncomingMacros` share ~90% of their structure: parse document attributes, find item blocks, scan for macros, build a grouped map of relationships, call `generateLinksAsciiDoc`, apply replacements. The only differences are the relationship lookup direction and incoming's inverse-label transformation.

## Goals / Non-Goals

**Goals:**
- New `traceability:links[]` macro expands to outgoing + incoming links in a single block
- Outgoing groups appear first, incoming groups second, with no wrapper section headers
- Respects all existing document attributes (`:traceability-style:`, `:traceability-order:`, `:traceability-collapsible:`, `:traceability-links:`)
- Zero changes to the existing outgoing/incoming macros

**Non-Goals:**
- Refactoring the shared logic between outgoing and incoming (desirable but out of scope)
- Changing the grouped-map structure or `generateLinksAsciiDoc` signature

## Decisions

### Decision 1: Compose from existing logic, don't refactor

The new `expandLinksMacros` method copies the structure of `expandOutgoingMacros` and `expandIncomingMacros` but builds two grouped maps (one outgoing, one incoming) and concatenates their `generateLinksAsciiDoc` output.

```
expandLinksMacros(file):
  for each item block with traceability:links[]:
    ┌─ Build outgoing grouped map (same as expandOutgoingMacros)
    │  getRelationships(itemId) → group by type → sort
    │  generateLinksAsciiDoc(outgoingGroups, style, ...)
    │
    ├─ Build incoming grouped map (same as expandIncomingMacros)
    │  getReverseRelationships(itemId) → apply inverse labels → group → sort
    │  generateLinksAsciiDoc(incomingGroups, style, ...)
    │
    └─ Replace macro with concat of both
```

No refactoring of shared logic. This keeps the change minimal and avoids touching the existing, well-tested macros. The ~40 lines of duplicated structure are acceptable — a future cleanup change can deduplicate all three methods.

### Decision 2: Outgoing first, then incoming, no wrapper headers

The combined output looks like:

```
.Addressed
* xref:...#ARC-001

.Depends on
* xref:...#REQ-003

.Addressed by
* xref:...#REQ-002
```

Groups are rendered in order: all outgoing relation-type groups first, then all incoming groups. Within each direction, groups sort according to `:traceability-order:` as normal. No "Outgoing Relations" or "Incoming Relations" section headers — the relation-type labels are self-describing.

If one direction has no relationships, only the other renders (no empty output for the empty side).

### Decision 3: Attribute inheritance unchanged

`traceability:links[]` uses the same document attributes (`:traceability-style:`, `:traceability-order:`, `:traceability-collapsible:`) that `traceability:outgoing[]` and `traceability:incoming[]` use. Both halves of the combined output share the same style and order settings — you can't set different styles for outgoing vs incoming within a single `links[]` macro. If you need that, use the individual macros.

When `:traceability-links:` is not set or is falsy, `traceability:links[]` remains as literal text (same behavior as the individual macros).

## Risks / Trade-offs

- **Duplicated code**: The new method duplicates ~40 lines from the existing two methods → Acceptable for now; all three can be refactored later into a shared helper.
- **Output length**: Combined output is longer than either individual macro → Expected; users opt in by choosing `traceability:links[]` over the individual macros.
- **No per-direction style control**: Both directions share the same style/order → Users who need different styles for outgoing vs incoming use the individual macros.
