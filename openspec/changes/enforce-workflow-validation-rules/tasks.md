## 1. Enforce the rules

- [x] 1.1 Add `findWorkflowValidationIssues()` to `TraceabilityGraph` and call it from `validate()`, and verify `antora-tracer validate` exits 1 with a naming error for the issue's reproduction
- [x] 1.2 Verify a satisfied rule (relation in either direction) passes, an item with no status is not gated, and a relation to the wrong role does not satisfy the rule

## 2. Reject dead configuration

- [x] 2.1 Validate the `validation` block in `ConfigLoader.validateConfig` — undeclared rule role, undeclared `requiresRoles` entry, non-list `requiresRoles` — and verify each fails `load()` with a naming error

## 3. Tests

- [x] 3.1 Add graph tests for unmet, satisfied (both directions), wrong-role, no-rule, and no-status cases, each with a positive control, and verify removing the enforcement fails them
- [x] 3.2 Add config-loader tests for the three rejected shapes, and verify removing the config check fails them
- [x] 3.3 Run `pnpm test` (624 passing) and `pnpm run lint`

## 4. Document

- [x] 4.1 Sync the delta specs into `openspec/specs/cli-validate/spec.md` and `openspec/specs/doc-reference/spec.md`
- [x] 4.2 Document `workflow` and `validation` in `reference/configuration.adoc`, add the REQ items, and regenerate the traceability output
- [x] 4.3 Rebuild the example site and verify no xref or validation regressions
