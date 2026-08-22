## Context

A reversible relationship is today expressed in three places, kept in sync by hand:

```yaml
# 1. forward allowance
relations:
  use_case:
    requirement: [leads_to]
  requirement:
    use_case: [is_derived_from]

# 2. pairing for graph merge + incoming display
inverseLabels:
  leads_to: is_derived_from

# 3. compile-time fallback (different naming convention)
# INVERSE_MAP: { "leads-to": "led-by", ... }
```

`isRelationAllowed` consults only `relations` (both directions must be listed). The graph's `_resolveInverseType` consults `inverseLabels` then `INVERSE_MAP` to detect complementary pairs and merge them. `inverseLabels` thus does double duty — it is both a display concern and a graph-structure concern — which is the source of the confusion.

The graph already merges two complementary directed edges into one `bidirectional` edge when *both* are authored (`bidirectional-relationship-merge`). The gap is entirely in the config layer and in single-sided authoring of the reverse name.

## Goals / Non-Goals

**Goals:**

- A relation is declared once, with its reverse, in a single place.
- The reverse name is always authorable; authoring either name produces the same canonical edge.
- The reverse direction is auto-allowed for validation (no second `relations` entry).
- Labels become purely cosmetic; the graph is never influenced by them.
- Remove the compile-time `INVERSE_MAP`/`PRIMARY_MAP`.

**Non-Goals:**

- No auto-creation of the reverse edge when one side is authored — authoring one side still stores one edge; it is simply *viewable* from both sides.
- No change to matrix row/column direction semantics (already bidirectional at query time).
- No new macro or CLI surface.

## Decisions

### D1: Keyed relation shape with a mandatory `reverse`

`relations` changes from `string[]` to a keyed map:

```yaml
relations:
  use_case:
    requirement:
      leads_to:
        reverse: is_derived_from
```

Each relation type is a key; `reverse` is a required sub-key. "Mandatory" is the user's explicit choice: every relation has exactly two authorable names, one per direction. A symmetric relation (same type in both directions) declares itself:

```yaml
requirement:
  requirement:
    conflicts_with:
      reverse: conflicts_with
```

Rationale: co-locating the pairing with the type it inverts makes the bidirectional edge legible, and "mandatory" removes the authorable-vs-display-only ambiguity that the current `inverseLabels` conflates.

### D2: Canonical primary storage (Option A)

The graph stores exactly one direction — the primary (the declared key). Authoring the reverse name canonicalizes at add-time:

- author `UC leads_to REQ` → stored `UC → REQ : leads_to`
- author `REQ is_derived_from UC` → stored `UC → REQ : leads_to` (flipped + renamed)

Consequence: the reverse type never appears as a stored edge type; it is an authoring alias plus an incoming display name. This makes matrices and Neo4j exports directionally stable and fixes the matrix coverage miss where a reverse-authored link was not counted against `coverageRelations`.

Implementation note: build a config-load-time index `reverse → { primary, primarySourceRole, primaryTargetRole }`. On `addRelationship`, if the authored type is a reverse value and the authored source/target roles are the swapped primary pair, rewrite the edge to primary form before storage.

### D3: Derived reverse allowance

`isRelationAllowed(source, target, type)` gains a fallback: if no direct `relations[source][target]` entry contains `type`, look up whether `type` is the reverse of a relation declared in the opposite direction (`relations[target][source][primary].reverse === type`). If so, allow it. This removes the need to declare `requirement → use_case: is_derived_from` at all.

### D4: `labels` are display-only, default `humanize()`

`inverseLabels` is renamed to `labels` and its meaning narrows to a type → human-readable name map, used only by rendering (incoming/outgoing lists, matrix headers, graph labels):

```yaml
labels:
  leads_to: "Leads to"          # optional — default is humanize("leads_to")
  is_derived_from: "Is derived from"
```

`humanize(type)` = replace `_` with a space and title-case. `labels` is optional and only overrides the default. The incoming view of an edge uses `labels[reverse(primary)]` (so `UC leads_to REQ` renders "Is derived from" on the requirement side), but that pairing comes from `relations.reverse`, not from anything called a label.

### D5: Delete `INVERSE_MAP` / `PRIMARY_MAP`

The compile-time maps are removed. The reverse pairing lives solely in `relations.reverse`. Validation fails fast on a relation type missing its mandatory `reverse`. This eliminates the hyphenated/passive naming convention that disagreed with the config's authorable types.

### D6: Bidirectional merge becomes canonicalize + dedupe

With D2, a reverse-authored edge is already canonicalized to primary at add-time, so the old "merge two complementary directed edges" logic collapses into: canonicalize (if reverse) then dedupe (if the canonical edge already exists, mark `bidirectional: true` and keep the first writer's metadata). This preserves the existing `bidirectional-relationship-merge` guarantees (no double-count, no false circular warnings) through a simpler mechanism.

### D7: Matrix coverage matches the canonical type

`MatrixGenerator` already queries both forward and reverse directions, so no traversal change is needed. Because storage is canonical (D2), `coverageRelations` names the primary type and matches both authoring styles. The existing `findRelatedItemsWithCache` filter `coverageRels.includes(rel.type)` now sees only primary types — the miss disappears.

## Risks / Trade-offs

[Breaking config change] → every preset and user config must migrate. Mitigation: this change migrates all four shipped presets and the example config; the schema is validated with a clear error for the old list shape.

[Mandatory reverse invents vocabulary] → e.g. `depends_on` now requires a reverse (`is_prerequisite_of`), adding authorable types users didn't previously have. Mitigation: accepted by the user as a deliberate consequence; each preset picks the natural reverse name.

[Reverse→primary index must stay consistent] → a type used as both primary and reverse across role pairs could be ambiguous. Mitigation: config validation rejects a reverse value that is also declared as a primary key elsewhere, unless it is a self-reverse.

[One-way relations no longer expressible] → under mandatory reverse, a strictly directional relation cannot be declared. Mitigation: the user's model treats every relation as reversible; if a truly one-way relation is needed later, `reverse` may be relaxed back to optional — this is the single highest-risk assumption and is called out for review at implementation.
