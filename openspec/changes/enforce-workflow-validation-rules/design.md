## Context

See proposal.md - Why. `validation` is already parsed into
`CompleteConfig.validation` and merged by preset inheritance
(`TraceabilityConfig.ts`), so only the consumer is missing.

## Goals / Non-Goals

**Goals:**
- One enforcement point so the CLI and the Antora build cannot diverge.
- Fail loudly on config that can never be satisfied.

**Non-Goals:**
- Enforcing `workflow` state transitions. `requiresRoles` is a graph-only
  obligation; transitions need ordered authoring context the graph does not
  carry, and the issue scopes this to `requiresRoles`.
- Changing `validate()`'s return shape.

## Decisions

**Enforce inside `TraceabilityGraph.validate()`, not in the CLI command.** The
CLI calls `validate()`; so does `RequirementsTraceabilityExtension.validate()`.
Putting the check in the graph makes every consumer enforce it and keeps the
rule next to the other graph-level checks (circular references, supersession).

**Satisfy the rule by a relation in either direction.** A relation can be
stored with the gated item as source or target depending on which side authored
it (`change addresses requirement` vs `requirement addressed_by change`), so the
check uses `getAllRelatedItems` (both directions) rather than the outgoing side
alone — the same lesson as the supersession fix in 0.34.0.

**Require the status to match exactly.** Statuses are free-form strings; the
rule key is compared as authored, consistent with the matrix `rowFilter`'s
status comparison. No normalization, so a config's own spelling governs.

**Reject undeclared roles at config load.** A rule naming a role outside
`roles` can never be satisfied; catching it at load is the same treatment the
matrix `rows`/`columns` checks already give, and turns a silent no-op into a
startup error.

## Risks / Trade-offs

- [A project with rules and currently-violating items starts failing `validate`
  and the Antora build] → Intended: that is the gate the config asked for. The
  example site declares no rules, so it is unaffected.
- [Statuses are case-sensitive] → Matches the existing `rowFilter` behavior;
  documenting the key makes the expectation explicit.
