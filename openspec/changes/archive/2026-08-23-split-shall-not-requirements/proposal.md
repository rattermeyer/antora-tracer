## Why

A requirements review flagged nine `REQ` items that bundle a positive `SHALL` and a `SHALL NOT` in one block, violating the atomicity convention now documented in the `requirements-writing` skill. Each must become one obligation per requirement.

On closer inspection they fall into two buckets, which call for two different mechanisms:

- **Genuine split** — the positive and negative obligations are *distinct* behaviours. These use the supersession feature (one predecessor → multiple successors).
- **Redundant negation** — the `SHALL NOT` is just the negation of the positive, i.e. the same behaviour phrased twice. These are rewritten to a single `SHALL`, not split.

This is the first dogfooding of the supersession feature on the example site's own requirements.

## What Changes

**Genuine splits (supersede with two successors):**

| Item | Spec | Split into |
|---|---|---|
| `REQ-129` | `bidirectional-relationship-merge` | detect the reverse-authored pair · do not store a second edge |
| `REQ-071` | `inverse-labels` | support `labels` · `labels` do not affect the graph |
| `REQ-174` | `preset-inheritance` | a preset does not extend itself · cycles are detected and rejected |
| `REQ-215` | `graph-diff` | no rename heuristic · superseded pair appears as removed + added |

**Redundant negations (rewrite to one SHALL):**

| Item | Spec | Rewrite to |
|---|---|---|
| `REQ-091` | `parser-verbatim-skip` | "SHALL preserve inline macros inside verbatim blocks" |
| `REQ-082` | `lunr-item-anchor-indexing` | "SHALL index only elements within the article body" |
| `REQ-167` | `matrix-status` | "SHALL render one per-row status column" |
| `REQ-199` | `doc-self-traceability` | "SHALL keep traceable items in their source files" |

`REQ-103` (`traceability-links-macro`) is borderline and is deferred to a decision during implementation.

Every split updates the spec file, the index `REQ` block, `addresses:`/`verifies:` links, and regenerates matrices — in one commit.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `bidirectional-relationship-merge`, `inverse-labels`, `preset-inheritance`, `graph-diff` — one requirement each split into two.
- `parser-verbatim-skip`, `lunr-item-anchor-indexing`, `matrix-status`, `doc-self-traceability` — one requirement each rewritten.

## Impact

- `openspec/specs/*.md` — split/rewrite the affected requirements.
- `examples/tracer/modules/requirements/pages/index.adoc` — new `REQ` blocks with `supersedes` links (splits) or rewrites; old items superseded where split.
- `examples/tracer/modules/ROOT/pages/explanation/architecture.adoc` + `self-traceability/test-plan.adoc` — re-point `addresses:`/`verifies:` links.
- Regenerate matrices.
- No code changes.
