## Why

Antora site generation loads `traceability.yml` to obtain traceability roles, relations, and matrices, but currently fails to load that project configuration when the optional `idAllocation.token` references an unset environment variable. The site build then silently falls back to a preset, so valid xrefs to custom generated matrices become unresolved even though site generation never contacts the allocator.

## What Changes

- Keep site generation independent of the remote allocator token while preserving strict failure when `next-id` attempts remote allocation without its configured token.
- Resolve allocator credentials only for the CLI operation that uses them; do not weaken configuration validation or silently substitute an empty credential for remote allocation.
- Preserve local `next-id --local` behavior without requiring remote allocator credentials.

## Capabilities

### New Capabilities

### Modified Capabilities
- `next-id`: Specify that an unset allocator token does not prevent unrelated configuration consumers, while remote `next-id` still fails closed when its configured token is unset.

## Impact

- `src/config/TraceabilityConfig.ts`: environment interpolation during config loading.
- `src/antora-extension.ts`: loading the project configuration for site generation.
- `src/cli.ts`: credential handling for remote and local `next-id` modes.
- `test/config-loader.test.ts`, `test/antora-extension.test.ts`, and `test/cli.test.ts`.
- `openspec/specs/next-id/spec.md` and CLI/configuration reference documentation.
