## Why

The `requirements-engineering` preset defines wide multi-column matrices (e.g., requirements → [design, implementation, test, document]) that produce dense, multi-purpose tables. The extension's own `generateDefaultMatrixNames` fallback already generates pairwise matrices (e.g., `requirements-design`, `requirements-tests`). Changing the preset to pairwise matrices aligns it with the code's natural behavior and produces focused, single-question traceability tables that are easier to review and navigate.

## What Changes

- **Replace wide matrices with pairwise matrices** in the `requirements-engineering` preset (`src/presets/requirements-engineering.yml`)
- **Align the example site config** (`examples/traceability.yml`) to use pairwise format consistently
- **Update the preset's documentation** section to describe the pairwise matrix structure

The four current wide matrices become three pairwise matrices:

| Before (wide) | After (pairwise) |
|---|---|
| `requirements-traceability` (req → design, impl, test, doc) | `requirements-to-design` (req → design) |
| `design-verification` (design → req, impl, test, doc) | `design-to-implementation` (design → impl) |
| `implementation-coverage` (impl → req, design, test) | `requirements-to-tests` (req → test) |
| `test-coverage` (test → req, design, impl) | _(removed — covered by requirements-to-tests)_ |

## Capabilities

### New Capabilities

_None — this is a configuration-only change._

### Modified Capabilities

_None — no code or spec-level behavior changes._

## Impact

- `src/presets/requirements-engineering.yml` — matrix definitions replaced
- `examples/traceability.yml` — aligned with new preset structure
- Users who relied on specific matrix names (e.g., `requirements-traceability`) will see different names after upgrading — this is a **BREAKING** config change for anyone using the preset with hardcoded matrix name references
