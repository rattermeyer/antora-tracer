## Context

See `proposal.md` and `specs/role-guidance/spec.md`.
The `requirements-engineering-max` preset defines `business_goal` and its relations but does not associate it with an authoring page.

## Goals / Non-Goals

**Goals:** Reuse the existing per-role guidance mechanism and follow the established AsciiDoc guidance format.

**Non-Goals:** Add a business-goal role or invent an ID prefix or traceability relations.

## Decisions

Add one guidance page and map it to `business_goal` in the max preset.
Omit `idPrefix` because no business-goal ID convention is established in the repository.
Keep goal items as upstream outcomes. Show optional relationships on downstream `user_need` or `quality_attribute` items using the configured inverse `is_motivated_by` to point back to the business goal.

## Risks / Trade-offs

No default ID prefix means authors must follow an existing project convention or agree one before creating IDs; this avoids imposing an unsupported convention.
