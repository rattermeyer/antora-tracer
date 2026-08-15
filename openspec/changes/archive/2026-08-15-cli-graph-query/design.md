## Context

The CLI already has a `process` command that parses `.adoc` files into an in-memory `TraceabilityGraph`.
The graph has a rich query API (`getReverseRelationships`, `getImpactAnalysis`, `findPath`, `validate`, `getRelatedItems`, etc.) that is fully exercised at build time.

After the build that graph is discarded.
When an AI agent or contributor works in the repo — without running a build — they have no way to query the relationship structure except grepping raw `.adoc` source files.
The existing `validate` command is the closest thing but it only checks for errors, not answers navigational questions.

The insight from a real cleanup session (REQ-005 removal): the traceability relationships in the source were exactly what the agent needed, but the agent had to reconstruct them by grepping IDs rather than querying the graph.

## Goals / Non-Goals

**Goals:**
- A `query` subcommand that parses source files, builds the in-memory graph, and answers one structural question per invocation.
- No Antora build required — parses `.adoc` files directly using the existing `DocumentParser`.
- Structured `--json` output for AI/CI consumption alongside a human-readable default.
- Cover the four query types that matter for refactoring and cleanup: reverse edges, impact, orphans, path.

**Non-Goals:**
- No client-side explorer UI (browser, static site).
- No persistent `graph.json` artifact committed to the repo or emitted to the site.
- No interactive/REPL mode.
- No graph query language (Cypher, SPARQL, etc.) — named subcommands only.
- No changes to the Antora extension.

## Decisions

### D1: Named subcommands, not a query language

`antora-tracer query reverse REQ-005`
`antora-tracer query impact REQ-005`
`antora-tracer query orphaned`
`antora-tracer query path REQ-005 TST-012`

A query language (Cypher, custom DSL) would be overkill.
The four named subcommands cover the refactoring-relevant questions identified in practice.
Additional subcommands can be added without breaking changes.

Alternative considered: a `--filter` expression flag. Rejected: harder to document, harder for an AI agent to discover.

### D2: Parse source files directly, reuse existing DocumentParser + TraceabilityGraph

The `stats` and `validate` commands already do: read files → parse → build graph → query.
`query` follows the same pattern.
No new parsing logic, no new graph logic — only new output formatters and Commander wiring.

Alternative considered: emit a `graph.json` artifact (committed or site-side) and query that.
Rejected for this change: adds a sync-maintenance burden (committed artifact) or requires an Antora build (site artifact).
A persistent artifact may be added later if demand warrants it.

### D3: `--json` flag for structured output, table default for human output

Human output: aligned table with relevant columns per subcommand.
Machine output (`--json`): array of objects with full item/relationship fields, suitable for `jq` or direct agent consumption.

This mirrors the existing `process --format json` and `matrix --format csv/json` conventions.

### D4: `-i / --input` as the source flag, defaulting to `.`

Existing commands use `-i / --input` for the source path.
`query` accepts the same flag for consistency.
The source path defaults to `.` (current directory) so the common case (`antora-tracer query reverse REQ-005`) requires no extra flags.

## Risks / Trade-offs

[Large repos with many files] → Parse time may be noticeable for large documentation sets.
Mitigation: the existing `DocumentParser` is fast; the risk is low for typical Antora projects (hundreds of files). If it becomes an issue, caching a `graph.json` artifact is the natural upgrade path (aligns with D2 alternative above).

[Query subcommand discoverability] → Users may not know which subcommands exist.
Mitigation: `antora-tracer query --help` lists all subcommands with examples.

[Output format drift] → JSON schema of query results may change across versions.
Mitigation: keep the JSON shape equal to the existing `Item` and `ItemRelationship` interfaces — no new types introduced.

## Open Questions

- Should `orphaned` report items with no outgoing OR no incoming relationships, or only items with neither?
  Lean: items with no relationships in either direction are the highest-signal orphans; items with only incoming (e.g., a terminal test) are normal.
- Should `path` report all paths or just the shortest?
  Lean: shortest first (existing `findPath` already does BFS); show count of alternates if more exist.
