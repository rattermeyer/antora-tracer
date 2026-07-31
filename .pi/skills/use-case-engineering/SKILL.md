---
name: use-case-engineering
description: Create or review use case descriptions for requirements engineering in AsciiDoc/Antora Tracer format. Use when the user wants to write use cases, review existing use cases for completeness, or check that use cases are properly traced to requirements.
location: /home/richard/devel/git/antora-tracer/.pi/skills/use-case-engineering/SKILL.md
---

# Use Case Engineering Skill

Help the user create or review use case descriptions in AsciiDoc format for the Antora Tracer requirements engineering workflow.

## When to Use

- User asks to "write a use case" or "create use case descriptions"
- User says "review my use cases" or "are these use cases complete?"
- User mentions "trace use cases to requirements" or "use case traceability"
- User wants to validate use case structure or completeness

## Use Case Template

Each use case is an `[item]` block with `role=use_case`:

```asciidoc
[#UC-NNN, item, role=use_case, title="<Actor> <action> <outcome>"]
--
As a <role>, I want to <action> so that <benefit>.

<optional additional context: preconditions, trigger, success scenario, extensions>
--
leads_to:REQ-XXX[]
leads_to:REQ-YYY[]

traceability:outgoing[]
traceability:incoming[]
```

### ID Convention

- Prefix: `UC` (use case)
- Numbering: 3-digit padded (`UC-001`, `UC-002`, ...)
- Use `antora-tracer next-id --prefix UC -i docs/` to get the next available ID

### Naming Convention

- Title format: `<Actor> <action verb> <outcome>`
- Example: "Author writes traceable items in AsciiDoc"
- Use present tense, active voice

### Body Format

- Always start with "As a <role>, I want to <action> so that <benefit>."
- Optionally add preconditions, trigger, success scenario, extensions as bullet points
- Keep it focused on one user goal

### Tracing to Requirements

- Use `leads_to:REQ-XXX[]` to show which requirements this use case motivates
- The inverse label "Is-derived-from" appears on the requirement's incoming section
- Each use case should trace to at least one requirement
- Use `traceability:outgoing[]` to render the "Leads-to" section
- Use `traceability:incoming[]` to render incoming relationships (if any)

## Review Checklist

When reviewing use cases, check:

### Structure
- [ ] Uses `role=use_case` attribute
- [ ] Has a unique, padded ID (`UC-NNN`)
- [ ] Title follows `<Actor> <action> <outcome>` pattern
- [ ] Opens with `--` and closes with `--`

### Content
- [ ] Body starts with "As a <role>, I want to <action> so that <benefit>"
- [ ] Describes one clear user goal (not multiple)
- [ ] Role is specific (e.g., "documentation author" not "user")
- [ ] Action is observable and testable

### Traceability
- [ ] At least one `leads_to:REQ-XXX[]` relationship
- [ ] All referenced REQ IDs exist in the requirements document
- [ ] `traceability:outgoing[]` is present for rendering
- [ ] Page has `:traceability-links: true` attribute

### Consistency
- [ ] ID follows the existing numbering convention
- [ ] Title style matches other use cases in the project
- [ ] Relationship direction is correct (use case → requirement)

## Config Requirements

The use case role must be defined in `traceability.yml`:

```yaml
extends: requirements-engineering

roles:
  - use_case

relations:
  use_case:
    requirement: [leads_to]

inverseLabels:
  leads_to: "is-derived-from"
```

## Related Commands

```bash
# Get next available UC ID
antora-tracer next-id --prefix UC -i docs/

# Validate traceability after adding use cases
antora-tracer validate -i docs/

# Check the usecase-requirements matrix
# Navigate to attachment$traceability/matrix-usecase-requirements.html
```
