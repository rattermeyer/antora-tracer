## Why

`export neo4j` only exports the files under a single `-i <dir>`, but a team's traceability is often spread across multiple repositories aggregated by an Antora playbook. `site-graph` already harvests that complete cross-source graph, but only emits a JSON snapshot — there is no way to export the complete graph to Neo4j.

## What Changes

- `export neo4j` gains an optional `<playbook>` positional argument.
- With `-i <dir>`, it processes a local directory (unchanged).
- With `<playbook>`, it harvests every component and repository in the playbook via `harvestSiteFiles` and exports the complete graph.
- With neither, it errors.

## Capabilities

### New Capabilities

- `neo4j-export`: the `export neo4j` command — exporting the traceability graph to Neo4j CSV or Cypher from a local directory or an Antora playbook.

### Modified Capabilities

_None._

## Impact

- **CLI**: `export neo4j` reuses `harvestSiteFiles` (already imported) and mirrors `seed`'s two-input-mode pattern.
- **Docs**: `reference/cli.adoc` (new playbook argument), `how-to/neo4j-export.adoc` (playbook mode).
- **Tests**: playbook-mode export and missing-input error.
