## Context

The example site demonstrates self-traceability: the extension traces its own requirements, design, tests, and use cases. The delivery process (CI/CD) is currently documented only as code (`.github/workflows/`) and a narrative section in the architecture document (ARC-031). This is an opportunity to demonstrate traceability of process requirements to product requirements — a pattern users can adopt for regulated or quality-conscious domains.

## Goals / Non-Goals

**Goals:**
- Add 6 process requirements covering the full delivery pipeline
- Trace process requirements to product requirements they validate
- Trace process requirements to architectural decisions they implement
- Add a `process → product` matrix
- Keep the existing `requirements-engineering` preset unchanged (example config extends it)

**Non-Goals:**
- Adding a new built-in preset (example-only, not shipped)
- Modifying the extension code
- Adding process tests (TST items for CI — out of scope)

## Decisions

### Decision 1: `process_requirement` role with `validates` and `deploys` relations

```
roles:
  - process_requirement

relations:
  process_requirement:
    requirement: [validates]
    design: [deploys]
```

`validates` means "this process step verifies that requirement holds." `deploys` means "this process step implements this architectural decision."

**Alternative considered:** Use `requirement` role with a different ID prefix (PRC-XXX). Rejected — role-based separation is clearer for matrices and matches the extension's config-driven design philosophy.

### Decision 2: Six process requirements (PRQ prefix)

Prefix PRQ (Process ReQuirement) parallels REQ (product REQuirement). PDE (Process DEsign) is reserved for future process architecture decisions, mirroring ARC (product ARChitecture).

| ID | Title | Validates | Deploys |
|---|---|---|---|
| PRQ-001 | CI workflows trigger on push and PR | (product reqs via CI) | ARC-031 |
| PRQ-002 | Test suite runs as merge gate | REQ-087, REQ-088, REQ-089 | ARC-031 |
| PRQ-003 | Example site builds without errors | REQ-005 | ARC-031 |
| PRQ-004 | Example site deploys from main branch | REQ-072 | ARC-033 |
| PRQ-005 | Release is tagged and versioned | (release process) | ARC-031 |
| PRQ-006 | PDF artifacts are generated alongside HTML | REQ-060, REQ-093 | ARC-031 |

Each requirement includes a description of what the CI workflow does and how it verifies the product.

### Decision 3: Process matrix in traceability.yml

```yaml
matrices:
  - name: process-to-product
    description: "Process requirements traced to product requirements"
    rows: process_requirement
    columns: [requirement]
    coverageRelations:
      requirement: [validates]
```

This matrix shows which CI checks cover which product requirements.

## Risks / Trade-offs

- **[Risk] Process requirements drift from CI code**: The YAML workflows are the ground truth; the traceability document is documentation. → **Mitigation**: The document describes the intent and structure, not exact line numbers. Changes to CI workflows should prompt an update to the process document.
- **[Risk] `process_requirement` role in example config adds complexity**: Users may not need this in their own projects. → **Mitigation**: The role is only in the example config (`examples/traceability.yml`), not in any built-in preset. Users only adopt it if they want to.
- **[Risk] `process_design` role not included**: CI/CD infrastructure decisions (runner sizing, branch strategy) have no design traceability. → **Mitigation**: ARC-031 already covers the CI/CD architecture as a product concern. `process_design` role and PDE prefix reserved for a future change.
