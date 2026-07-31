# Proposal: Add use-case role to example site

## Problem
The self-traceability example site uses three roles (requirement, design, test) that match the `self-traceability` preset exactly. The `examples/traceability.yml` config "extends" the preset but doesn't actually change anything — no role, relation, or matrix is added beyond what the preset already defines. This means:

- **REQ-012** (Configuration can extend presets) is never demonstrated in the example site
- **REQ-014** (Directional relation checking) gets no new scenario
- Readers don't see how to model a genuinely different domain concept
- The example presets don't showcase non-software-engineering use cases

## Solution
Add a `use_case` role to the self-traceability example with real use cases for the extension itself. Five use-case items describe author/reviewer workflows and trace into existing requirements via `leads_to` relations. A new `usecase-requirements` matrix demonstrates cross-role coverage.

## What changes

### New page
- `examples/modules/ROOT/pages/use-cases.adoc` — five UC items (UC-001 through UC-005)

### Config extension
- Add `use_case` to `examples/traceability.yml` roles
- Add `use_case → requirement: [leads_to]` relation
- Add `usecase-requirements` matrix

### Nav update
- Add Use Cases link to `examples/modules/ROOT/nav.adoc`

### Metrics
- +5 items, +1 new role, +1 new relation type, +1 new matrix
- No code changes required — purely example-site content

## Scope
Example site only. No code, no extension behavior changes. Fully backward compatible.
