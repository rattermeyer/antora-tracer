## Why

When an AI agent or contributor works in the source repo — changing a requirement, removing a feature, renaming an item — they currently have to grep `.adoc` files for IDs and hope the search terms are complete.
The traceability relationships are there in the source, but they are latent: no structured way to ask "what points at REQ-005?" or "which requirements have no test coverage?" without running a full Antora build.

## What Changes

- **New `query` subcommand on the CLI** — parses `.adoc` source files directly (no Antora build required) and answers structured questions about the traceability graph: reverse edges, impact, orphans, uncovered items, path between two items.
- **Structured output** — default human-readable table; `--json` flag for machine/AI consumption.
- **Scoped to a directory** — `antora-tracer query reverse REQ-005 --input src/docs` works from the repo root or any subtree.

## Capabilities

### New Capabilities

- `cli-query`: A `query` subcommand that parses source files, builds the in-memory graph, and answers structural questions without requiring an Antora build.

### Modified Capabilities

<!-- None: no existing spec-level behavior changes. -->

## Impact

- `src/cli.ts` — new `query` command and subcommands wired to Commander
- `src/DocumentParser.ts` — already used by CLI; no changes expected
- `src/TraceabilityGraph.ts` — already has the query methods needed (`getReverseRelationships`, `getImpactAnalysis`, `findPath`, `validate`); no changes expected
- No new dependencies
- No breaking changes
