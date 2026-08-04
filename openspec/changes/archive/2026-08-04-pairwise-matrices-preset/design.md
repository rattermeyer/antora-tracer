## Context

The `requirements-engineering` preset currently defines four wide matrices where each has 3-4 column roles. The extension's `generateDefaultMatrixNames()` fallback in `antora-extension.ts` already generates pairwise matrix names (`requirements-implementations`, `requirements-tests`, `requirements-design`), indicating the codebase's natural tendency toward pairwise matrices.

## Goals / Non-Goals

**Goals:**
- Replace wide matrices with focused pairwise matrices in the preset
- Align the example site's `traceability.yml` with the new structure
- Update the preset's embedded documentation to reflect the new matrix design

**Non-Goals:**
- Change the MatrixGenerator code
- Change how the Antora extension generates matrices
- Add auto-generation of pairwise matrices (purely config-driven)
- Modify other presets (`agile`, `medical-iec62304`, `minimal`)

## Decisions

### Decision 1: Three pairwise matrices covering the forward traceability chain

The new matrix set follows the classic forward traceability flow:

```
requirements ──→ design ──→ implementation
     │
     └──→ test (direct)
```

New matrix definitions:

```yaml
matrices:
  - name: requirements-to-design
    description: "Forward traceability from requirements to design"
    rows: requirement
    columns: [design]
    coverageRelations:
      design: [addresses, satisfies]

  - name: design-to-implementation
    description: "Forward traceability from design to implementation"
    rows: design
    columns: [implementation]
    coverageRelations:
      implementation: [implements, realized_by]

  - name: requirements-to-tests
    description: "Direct traceability from requirements to tests"
    rows: requirement
    columns: [test]
    coverageRelations:
      test: [covers, verifies]
```

**Rationale**: Each matrix answers one question ("which designs address this requirement?") rather than four questions at once. Coverage percentages are now per-hop: 85% of requirements have design coverage, 60% of designs have implementations, 40% of requirements have test coverage. These individual numbers are more actionable than a single aggregate "requirements-traceability" coverage.

### Decision 2: Drop the backward (verification) matrices

The current preset includes `design-verification` (design → requirement), `implementation-coverage` (impl → requirement, design), and `test-coverage` (test → requirement, design, impl). These are "verification" matrices that look backward up the chain.

They are dropped because:
- They duplicate the same data from different perspectives (the relationship graph is the same)
- The forward chain (`requirements-to-design` + `design-to-implementation` + `requirements-to-tests`) already captures all traceability
- Users who need backward views can add them via custom config or use Neo4j queries
- Keeping the preset minimal and focused follows the principle of least surprise

### Decision 3: Keep the example site config consistent with the preset

`examples/traceability.yml` currently extends `requirements-engineering` and adds a `usecase-requirements` matrix. After the preset change, it will:

```yaml
extends: requirements-engineering

roles:
  - use_case

relations:
  use_case:
    requirement: ["leads_to"]

matrices:
  - name: usecases-to-requirements
    description: "Use cases traced to requirements"
    rows: use_case
    columns: [requirement]
    coverageRelations:
      requirement: [leads_to]
```

The name changes from `usecase-requirements` to `usecases-to-requirements` for consistency with the new naming convention (`source-role-to-target-role`).

## Risks / Trade-offs

- **Matrix names change**: Users with hardcoded references to `requirements-traceability`, `design-verification`, etc. will break → Mitigation: This is a preset config file; users customize it anyway. Document the name change in the preset description.
- **Fewer matrices**: Dropping backward matrices means some views (e.g., "which tests cover this design?") aren't in the default preset → Mitigation: Users can add custom matrices in their config. Neo4j export provides the same data with more query power.
- **Coverage semantics change**: "75% requirements-traceability" becomes "75% requirements-to-design coverage" which is a different, narrower number → Mitigation: This is intentional — narrower numbers are more honest and actionable.
