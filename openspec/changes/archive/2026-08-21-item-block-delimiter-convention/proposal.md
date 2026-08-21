## Why

The example site's prose pages (tutorial, how-to, reference) use `====` (example block) as the `[item]` block delimiter, while the self-traceability data pages (requirements, architecture, test-plan) use `--` (open block). Both parse identically, but the split is inconsistent, and `====` renders every item as a boxed "database entry". Separately, the getting-started tutorial carries stale factual claims (old output paths, a matrix claim its example does not satisfy).

## What Changes

- **Adopt `--` as the canonical `[item]` block delimiter** across the example site's prose pages, aligning them with the data pages (the smaller migration).
- **Document `====` as a valid alternative** in the item macro reference, including the rendering difference (open block = inline; example block = boxed), so users can choose.
- **Fix stale getting-started claims**: output paths, the `requirements-to-design` matrix statement, and loose "coverage report" phrasing.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `documentation-style-rules`: adds a requirement that item block examples use the `--` open-block delimiter, with `====` documented as an alternative.

## Impact

- `examples/tracer/modules/ROOT/pages/tutorial/getting-started.adoc`, `how-to/*.adoc`, `reference/item-macro.adoc`, `reference/traceability-macros.adoc`, `explanation/traceability-model.adoc`, `self-traceability/use-cases.adoc` — delimiter migration and stale-claim fixes.
- No code changes, no new dependencies.
