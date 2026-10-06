## Context

See `proposal.md` for motivation and the two delta specs for required behavior. Items already carry Antora component, module, and version metadata; graph indexes, relationship endpoints, and Neo4j export currently use bare IDs. The diff implementation already defines identity as component + version (when present) + ID, with bare-ID identity for unscoped items.

## Goals / Non-Goals

**Goals:**

- Use one stable identity rule from graph construction through snapshot diffing and Neo4j export.
- Preserve human-authored item IDs and single-source behavior.
- Resolve relationships deterministically when identical IDs occur in multiple scopes.

**Non-Goals:**

- Change the item macro syntax or introduce a new syntax for cross-component references.
- Include module in item identity; the established diff identity and duplicate scope are component, version, and ID.
- Change snapshot diff classification or add Neo4j import orchestration.

## Decisions

### Use a shared component-qualified identity key

Use the existing identity tuple—component, version (empty when absent), and item ID—to form the canonical key for graph storage, relationship endpoints, and exported node identity. Unscoped items retain their bare ID key. Keep `Item.id` unchanged for display and authoring; do not encode scope into user-visible IDs. Put key creation in a shared utility so graph, diff, and exporter cannot drift. Keep module as item metadata, not an identity dimension, matching current diff and duplicate semantics.

### Carry source scope with parsed relationships

Record the containing file's component and version on each parsed relationship. Resolve its source endpoint in that scope. Resolve a target first in the same component/version; if no in-scope target exists, accept a target only when exactly one graph item has that bare ID. If multiple out-of-scope candidates exist, leave the relationship unresolved and emit the existing graph warning rather than selecting one arbitrarily. Apply this resolution during deferred relationship canonicalization as well, so parse order does not change endpoints.

Graph indexes and relationship deduplication use canonical endpoint keys. Keep existing bare-ID graph calls working for unscoped input and unambiguous IDs; add scoped lookup for internal operations that already know an item's scope. A bare-ID lookup with multiple scoped matches must not silently return an arbitrary item.

### Export canonical identity separately from display IDs

Keep the `id` node property/CSV column as the original item ID and add the canonical identity plus component and version scope fields. In CSV relationships, keep `source` and `target` as canonical endpoint identities, and add `sourceId` and `targetId` for the original bare IDs. This preserves existing output values for unscoped graphs while making scoped CSV endpoints unambiguous. In Cypher, `MERGE` nodes by canonical identity and match relationship endpoints by the same identity; keep role and other attributes as node properties rather than part of node identity.

### Preserve local-input compatibility

For unscoped input the canonical identity equals the existing bare ID, so existing node keys, CSV endpoints, and lookup behavior remain unchanged. Do not add dependencies or migrate stored data; the output remains a generated export that can be regenerated from source content.

## Risks / Trade-offs

- [Bare-ID lookups can become ambiguous in a multi-source graph] → Use scoped lookups for graph traversal and relationship resolution; never pick an arbitrary duplicate for a bare-ID lookup.
- [CSV consumers may assume `source` and `target` are authored IDs] → Keep authored values in `sourceId` and `targetId`, document the canonical endpoint columns, and leave unscoped values unchanged.
- [A bare cross-component target can be ambiguous] → Resolve locally first, accept an out-of-scope target only when globally unique, and otherwise retain an unresolved relationship with a warning.
- [Existing Cypher imports may depend on the old MERGE key] → Preserve the `id` property and single-source identity values; generated export files are replaced on regeneration, with no in-place database migration.

## Migration Plan

1. Add canonical item identity and relationship scope to graph construction while retaining bare-ID behavior for unscoped callers.
2. Update CSV and Cypher output to use canonical identities for nodes and endpoints, preserving authored IDs as separate fields where needed.
3. Update exporter reference documentation to describe the scoped identity and CSV endpoint columns. Regenerate exports to adopt the new format; rollback by regenerating with the previous package version. No stored graph migration is included.

## Open Questions

None.