## Why

`validation.<role>.<status>.requiresRoles` is declared in the config type,
populated by the `spec-driven-development` preset, parsed successfully, and
enforced nowhere. A project that configures it gets no gate, and `validate`
reports success for exactly the state the config forbids — so a preset
advertises a guarantee a reader cannot rely on.

## What Changes

- `TraceabilityGraph.validate()` SHALL enforce configured
  `validation.<role>.<status>.requiresRoles` rules: an item whose status matches
  a rule must have at least one relationship, in either direction, to an item of
  each required role. A violation is a validation error.
- Config loading SHALL reject a rule that names an undeclared role, a
  `requiresRoles` value that is not a list, or a rule for an undeclared role —
  the same dead-config class the matrix checks already guard.
- Document `workflow` and `validation` in the configuration reference; the
  example site's own config is unchanged (it declares no rules).

The check reads the graph alone, so it runs in `validate` and the Antora build
alike. Enforcement applies to every consumer of `validate()`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-validate`: the validate command gains the workflow-gate error kind, so a
  configured `requiresRoles` that is unmet fails the command with a non-zero
  exit code.
- `doc-reference`: the configuration reference documents the `workflow` and
  `validation` schema keys, which were previously absent from the page.

## Impact

- `src/TraceabilityGraph.ts` — workflow-rule enforcement in `validate()`
- `src/config/TraceabilityConfig.ts` — config validation for the `validation` block
- `test/graph-and-api.test.ts`, `test/config-loader.test.ts` — regression tests
- `openspec/specs/cli-validate/spec.md`, `openspec/specs/doc-reference/spec.md`
- `examples/tracer/modules/ROOT/pages/reference/configuration.adoc`
- `examples/tracer/modules/requirements/pages/index.adoc` — REQ items for the
  changed requirements
