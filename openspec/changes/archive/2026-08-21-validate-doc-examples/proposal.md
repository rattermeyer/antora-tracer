## Why

Doc examples — the `[item]` blocks shown in tutorials, how-to guides, and the reference — can drift from the configured model: unknown roles, disallowed relations, or stale syntax. Nothing validates them today, so a reader can copy an example that the extension would reject. The `update-example-site` skill regenerates traceability-typed docs but does not check prose examples.

## What Changes

- **New validation** that extracts `[item]` blocks from the example site's prose pages and validates them against the example configuration — unknown roles, invalid relations, and parse errors fail the check.
- **Runs as a test**, not a CLI command — a Mocha test reusing the existing `DocumentParser` and `ConfigLoader` validation.

## Capabilities

### New Capabilities

- `doc-example-validation`: extract `[item]` blocks from prose documentation pages and validate them against the traceability configuration.

### Modified Capabilities

<!-- none -->

## Impact

- `test/` — new test file (e.g., `test/doc-example-validation.test.ts`)
- Reuses `DocumentParser` and `ConfigLoader` — no parser or config changes
- No new dependencies
