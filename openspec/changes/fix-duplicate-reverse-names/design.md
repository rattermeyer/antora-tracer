## Context

See proposal.md — Why. `validateConfig` builds a `relationshipTypes` Set of every primary and reverse name and only ever checks membership, so a duplicate reverse is accepted. `getInverseType` scans `Object.values(config.relations)` and returns the first `def.reverse === type` match, so which primary wins depends on insertion order.

## Goals / Non-Goals

**Goals:** An ambiguous reverse name fails config load with both role pairs named; unambiguous reuse keeps working.

**Non-Goals:** Changing `getInverseType`; changing how relations merge through `extends`; rejecting duplicate reverse names outright (verbatim reuse of one `(primary, reverse)` pair across role pairs is legitimate and used by the presets).

## Decisions

**Decision 1 — reject conflicting reverses only, keyed by primary.**

Track `reverse → { primary, pair }` while walking the relations. The first declaration of a reverse records its primary; a later declaration with the *same* primary is benign reuse, and one with a *different* primary is an error naming both pairs. This is the "conflict-only" rule: it rejects exactly the case that makes resolution order-dependent, and leaves the presets' shared names working.

*Alternative rejected*: reject any repeated reverse name. It would break the legitimate shared `(primary, reverse)` pairs the presets rely on, for no resolution benefit — those pairs resolve unambiguously.

**Decision 2 — validate the merged config, not each file.**

`validateConfig` runs on the merged configuration (preset + overrides + extends chain), so a collision introduced by a project's override against a preset's relation is caught. The check sits in the existing relations loop, so it sees the same view `getInverseType` will.

## Risks / Trade-offs

- **A project relies on two different primaries sharing a reverse** → That configuration was already broken (order-dependent resolution); failing at load is the improvement the issue asks for.
- **Case sensitivity** → The check lowercases names, matching how `relationshipTypes` already normalizes.
