## Why

The id-server's `tokens` config maps `token → tenant` (the secret is the map key). That is awkward to author — users naturally write `tenant → token` — and it caused a real 401: a `tokens: { "antora-tracer": "${TRACER_ID_TOKEN}" }` config was interpreted as token `"antora-tracer"` → tenant `<secret>`, so the bearer token never matched. Swap the direction so the token is the value.

## What Changes

- `tokens` config becomes `tenant → token` (the secret is the value).
- `StaticTokenAuth.resolve` reverse-looks-up: given a bearer token, return the tenant whose token matches.
- Behavior is otherwise unchanged (unknown/absent token → 401, empty map → default tenant).

## Capabilities

### Modified Capabilities

- `id-allocation-server`: the "Tenancy is derived from the bearer token" requirement gains the `tokens` map shape (`tenant → token`).

## Impact

- **id-server**: `config.ts` (swap key/value), `auth.ts` (reverse lookup).
- **Tests**: `id-server/test/server.test.ts` token maps.
- **Docs**: `how-to/run-id-server.adoc` config example.
