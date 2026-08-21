## Context

The example site contains `[item]` example blocks in tutorial, how-to, and reference pages. These are prose, not traceable data, so `update-example-site` does not regenerate them. When the configuration changes (roles added or removed, relations redefined), these examples can silently become invalid.

The `DocumentParser` already parses AsciiDoc into items and relationships, and `ConfigLoader` / `TraceabilityGraph.validate()` already report unknown roles and invalid relations. The missing piece is feeding doc examples through that pipeline.

## Goals / Non-Goals

**Goals:**
- A test that extracts `[item]` blocks from prose pages and asserts they parse and validate against the example config.
- Fail on unknown roles, invalid relations, and parse errors.

**Non-Goals:**
- No CLI command, no new public API.
- No validation of narrative prose (paths, claims) — that is a manual checklist.
- No modification of the pages being validated (read-only extraction).

## Decisions

### D1: A Mocha test, not a CLI command

The project runs `npm test` in CI and already has a `scripts/` checker precedent (one-sentence-per-line). A test reuses the existing runner and validation logic with zero new surface. A CLI command is speculative.

### D2: Validate against the example config (`examples/traceability.yml`)

Doc examples target the example site's own model (the requirements-engineering preset plus its overrides). Validating against that config is the honest check — examples are written for that site.

### D3: Extract only real item blocks, skip verbatim fences

The pages contain item blocks inside `[source,asciidoc]` code fences (showing syntax). Extraction SHALL skip verbatim content, mirroring the parser's existing verbatim-skip logic, so code listings are not treated as real items.

## Risks / Trade-offs

[Examples intentionally showing invalid input] → if a page needs to show a rejected relation, exclude that page or mark the block via a comment convention.

[False positives from source-fence examples] → D3 addresses this; the extraction must not treat `[source]` listings as real items.

## Open Questions

- Should validation cover all prose pages or a curated list? Lean: all pages containing `item, role=` blocks, with an escape hatch for intentionally-invalid examples.
