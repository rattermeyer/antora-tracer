## Context

`registerContentClassifier()` builds the traceability graph per component version, clearing it each iteration so xrefs stay version-scoped (REQ-103). `sitePublished` then reads that same graph to generate matrices, coverage, and the overview. On a multi-component site the loop's last iteration wins, leaving only the last component's items — empty when that component has no items.

## Goals / Non-Goals

**Goals:**
- Generation passes see every item across all components and versions.
- Per-version xref isolation stays intact.

**Non-Goals:**
- No change to the CLI matrix path (`run-example.js`).
- No refactor of xref generation to be version-aware (the larger "option C").

## Decisions

1. **Two graphs, not re-parsing (option B).** A per-version working graph keeps the existing xref behaviour; a second accumulated full graph is built by `merge()` after each version. Re-parsing (option A) would re-read original content — the in-memory buffers are mutated by macro substitution — and double the parse cost.
2. **Full graph is a plain `TraceabilityGraph`** sharing the working extension's `ConfigLoader`, cleared at the start of each `contentClassified` pass for idempotency.
3. **Generation methods read the full graph**, keeping the `configLoader` from the working extension.

## Risks / Trade-offs

- [Duplicate merge] → the working graph is cleared per version, so each item merges once; the full graph is cleared at pass start for idempotency.
- [Memory] → one extra graph (up to ~2× item memory); negligible versus Antora's own footprint.
