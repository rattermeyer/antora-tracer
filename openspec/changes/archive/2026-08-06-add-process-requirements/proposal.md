## Why

The example site currently has no traceability for the delivery process — CI workflows, deployment pipeline, and quality gates exist as code but are not documented as traceable requirements. This creates a blind spot: we can trace product requirements to design and tests, but we can't trace which CI checks validate which requirements, or which deployment steps deliver which architectural decisions.

Adding process requirements with a dedicated role closes this gap and demonstrates a pattern users can adopt for their own projects.

## What Changes

- Add `process_requirement` role to `examples/traceability.yml` with a `validates` relation to `requirement` and a `deploys` relation to `design`
- Create `examples/component-one/modules/ROOT/pages/delivery-process.adoc` with 6 process requirements (PRQ-001 through PRQ-006) covering CI, testing, deployment, and release
- Add a `process-to-product` matrix to `traceability.yml`
- Update `run-example.js` to process the new file
- Reserve `process_design` role and PDE prefix for future CI/CD architecture decisions (not in this change)

## Capabilities

### New Capabilities

- `delivery-process-traceability`: The example site SHALL include a delivery process document with process requirements that trace to product requirements via a `validates` relation and to architectural decisions via a `deploys` relation. A dedicated matrix SHALL show traceability from process requirements to product requirements. Only the `process_requirement` role is added — process design remains out of scope to keep the product design matrix clean.

### Modified Capabilities

None — no code or existing user-facing behavior changes.

## Impact

- `examples/traceability.yml` — new role, relations, and matrix
- `examples/component-one/modules/ROOT/pages/delivery-process.adoc` — new document
- `examples/run-example.js` — process new file
- `examples/component-one/modules/ROOT/nav.adoc` — navigation entry
