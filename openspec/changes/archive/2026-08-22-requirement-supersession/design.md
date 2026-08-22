## Context

Controlled environments preserve released artifacts and review the impact of every replacement. Antora Tracer already supplies the required graph primitives: normal configurable relations, reverse lookup via `getReverseRelationships()`, and transitive traversal via `getImpactAnalysis()`. It currently lacks supersession semantics and current-vs-history view rules.

The key safety principle is: **supersession makes downstream work visible; it never hides or silently resolves that work.** A design that addressed an old requirement does not automatically address its successor.

## Goals / Non-Goals

**Goals:**

- Represent item history explicitly with a normal relation.
- Derive superseded state from graph facts rather than duplicate metadata.
- Keep stale incoming functional links visible and identify them as requiring review.
- Exclude historical items from current-state coverage matrices.
- Support one-to-one replacement, requirement splits, and requirement merges.
- Provide a read-only CLI worklist for authors and architects.

**Non-Goals:**

- Detect in-place mutation of released content.
- Cross-version supersession.
- Automatic source edits or link repointing.
- Changelog or generated archive pages.
- Blocking validation.

## Decisions

### D1: Generic supersession relation

`supersedes` (`successor → predecessor`) and reverse `superseded_by` are normal configurable relations. The core capability applies to any traceable item role; presets decide which same-role pairs allow it. Requirements are the first documented use case, but designs and tests may use the same lifecycle.

### D2: Relation-derived effective state

The `supersedes` relationship is authoritative. An item is effectively superseded when one or more valid incoming `supersedes` relations target it. An explicit `status=superseded` value is not required, avoiding two sources of truth.

If an explicit status is retained for another purpose, validation SHALL reject a conflict between it and the graph-derived state. `draft` and `active` remain authoring conventions but do not define whether an item has a successor.

### D3: Splits and merges are first-class

A predecessor may have multiple successors (split), and a successor may supersede multiple predecessors (merge). Successor lookup therefore returns a collection, not a single item. Validation rejects self-supersession, duplicate history links, and cycles in the supersession graph.

### D4: Current matrices filter; relationship views annotate

Current-state matrices omit effectively superseded items from both rows and columns by default. Superseded items remain in the graph, counts, audit exports, source pages, and explicit history queries.

Relationship macros do **not** filter functional links to superseded items. They retain the link and mark it `review required`, listing all direct successors. This prevents stale design and verification links from appearing clean.

### D5: History links are not suspect

`supersedes` and derived `superseded_by` are history/control relations. They are excluded from stale-link warnings and impact-review worklists. Only functional/domain relations such as `addresses`, `verifies`, `depends_on`, and `leads_to` require review.

### D6: Superseded source blocks remain visible

The source block remains in its original document and renders a superseded marker with links to every direct successor. Moving or collecting blocks into an archive page is deferred. The marker preserves context while matrices present only the current baseline.

### D7: Read-only CLI

`antora-tracer supersession check <id>` validates and reports an already-authored supersession. It outputs:

1. whether the item is effectively superseded;
2. its direct successor(s);
3. direct incoming functional relations requiring review, grouped by role and relation type.

`--impact` adds the transitive blast radius using `getImpactAnalysis()`. The command never writes AsciiDoc or metadata.

### D8: Advisory validation

`validate` warns when a functional relation targets an effectively superseded item. The warning names the source item, predecessor, relation type, and direct successor(s). It does not fail the build in this change; a strict release gate is deferred.

## Risks / Trade-offs

[Historical items remain in source pages] → current documents still contain the old text. Mitigation: a prominent superseded marker; generated archive pages can follow later.

[Filtering matrices but not macros] → views differ deliberately. Matrices answer "what is current?"; macros answer "what still requires review?". This distinction must be explicit in documentation.

[No baseline comparison] → the system cannot prove an item was not edited in place. Mitigation: scope the feature as supersession and impact review; version diff/hash enforcement is a separate capability.

[Multiple successors complicate display] → badges and warnings must list collections. Mitigation: define deterministic sorting by ID and test split/merge scenarios.
