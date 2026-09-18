## Why

The ID allocation server needs a `start` value per prefix to continue from a team's existing local IDs, but today that value is configured by hand (`prefixes: { REQ: { start: 55 } }`). The extension already scans items and computes `max+1` per prefix (`next-id`), and `site-graph` already harvests the full cross-source graph from a playbook. This change wires the two together: a `seed` command that emits a seed file automatically, including across repos.

## What Changes

- A new `seed` CLI command with two input modes: `-i <dir>` (a local directory) or `<playbook>` (all repos/components in an Antora playbook).
- A `getPrefixMaxima()` method on `TraceabilityGraph` returning numeric `{ prefix → { start, width } }` per prefix.
- `start` is the numeric `max+1` for each prefix — the first ID the server should allocate — not the current max, and not `getNextId`'s formatted `PREFIX-NNN` string.
- The seed file is emitted in the id-server's `prefixes` shape so it is directly consumable as seed.
- In playbook mode, items are deduplicated across component versions so each item contributes once to the max.

## Capabilities

### New Capabilities

- `seed-export`: the `seed` command — computing and exporting allocator seed values per prefix.

### Modified Capabilities

_None._

## Impact

- **CLI**: new `seed` command (two input modes), reusing `harvestSiteFiles` for the playbook mode.
- **Graph**: new `getPrefixMaxima()` method alongside `getNextId()`.
- **Docs**: `reference/cli.adoc` (new command), `how-to/run-id-server.adoc` (seed workflow).
- **Tests**: seed command cases for local dir, playbook, and output format.
