## Context

The role inventory is based on the six built-in presets. Several declare duplicate roles or use relation and matrix roles that do not match their role list; role guidance must follow the declared model and call out gaps without silently repairing preset semantics.

## Goals / Non-Goals

**Goals:** Provide guidance for each distinct declared role, reuse concise shared guidance when role semantics are equivalent, and preserve project-specific IDs and relations.

**Non-Goals:** Redesign preset role vocabularies, relations, matrices, or validation; prescribe IDs for roles without an established convention; claim standards compliance from documentation alone.

## Decisions

Use role-keyed AsciiDoc pages under `src/presets/guidance/`, matching the existing guidance mechanism.
Create standalone guidance for distinct Agile and IEC 62304 role concepts; reuse or tailor shared test, requirement, and test-case guidance only where their semantics are genuinely equivalent.
Map guidance for every role in each preset. Add `idPrefix` only for existing prefixes already established in preset configuration; otherwise omit it.
Describe configured relation direction precisely and mark optional links and rendering macros as optional.
Document inconsistent preset declarations as configuration gaps requiring future domain decisions; do not modify their meaning as part of guidance work.

## Risks / Trade-offs

[Role labels do not fully specify domain practice] → State only what configuration supports and keep unsupported details as questions or examples, not normative claims.
[One guidance page reused across multiple roles] → Reuse only when behavior and lifecycle are equivalent; separate pages where domain meaning differs.
[Preset inconsistency surfaces during verification] → Report the exact inconsistency; do not expand this documentation change into a preset redesign.
