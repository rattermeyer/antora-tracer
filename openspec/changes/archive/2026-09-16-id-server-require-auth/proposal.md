## Why

`StaticTokenAuth` currently attributes a request with no bearer token to the `default` tenant even when tokens are configured. That leaves an anonymous write path open on a public or multi-tenant instance, silently allocating IDs under `default`. Authentication should be all-or-nothing: when tokens are configured, an absent token must be rejected.

## What Changes

- When no tokens are configured, every request is attributed to the `default` tenant (single-tenant mode, unchanged).
- When tokens are configured, a request with an absent, malformed, or unrecognized token is rejected with `401`.
- No mixed mode: there is no path that combines named tenants with an anonymous `default` tenant.

## Capabilities

### Modified Capabilities

- `id-allocation-server`: the "Tenancy is derived from the bearer token" requirement changes — the absent-token case now requires the no-tokens-configured mode.

## Impact

- **id-server**: `StaticTokenAuth.resolve` — the empty-tokens check moves ahead of token extraction.
- **Tests**: auth scenarios in `id-server/test/server.test.ts`.
- **Docs**: `how-to/run-id-server.adoc` token semantics.
