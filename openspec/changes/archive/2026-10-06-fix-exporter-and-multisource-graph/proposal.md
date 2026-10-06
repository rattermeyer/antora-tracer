## Why

Playbook harvesting can collect items from multiple components and versions, but the graph currently indexes items and relationships by bare IDs, so equal IDs from different sources collide or resolve to the wrong item. The Neo4j exporter also identifies nodes and relationship endpoints by bare IDs, losing source identity and preventing a faithful cross-source export.

## What Changes

- Preserve distinct graph items and their relationships when IDs repeat across component versions, while retaining bare-ID behavior for unscoped local input.
- Export scoped item identity and relationship endpoints consistently in both Neo4j CSV and Cypher formats.
- Keep duplicate detection for repeated definitions within the same item scope.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multi-source-diff`: Require cross-source graph construction to preserve items with the same ID in different component versions and associate relationships with the correct scoped items.
- `neo4j-export`: Require playbook exports to preserve scoped node identity and relationship endpoints across components and versions.

## Impact

Changes affect graph identity and relationship handling, playbook graph construction, and Neo4j CSV/Cypher output. Existing local-input behavior and the documented snapshot diff identity remain compatible.