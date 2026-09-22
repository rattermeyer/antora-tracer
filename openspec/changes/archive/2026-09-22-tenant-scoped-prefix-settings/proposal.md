## Why

ID-prefix settings `width` and `start` are configured globally, keyed by prefix only, while counters are keyed by `(tenant, prefix)`. Two tenants that reuse the same prefix therefore seed from the same global `start` and emit identical IDs (`REQ-001`, `REQ-002`, …), colliding if their namespaces ever merge. Tenants need independent allocation parameters for the same prefix.

## What Changes

- Add an optional per-tenant prefix settings block that overrides the global `prefixes` block for a specific tenant.
- Resolve `start` and `width` for a `(tenant, prefix)` pair with fallback: tenant override → global `prefixes[prefix]` → default (`1` / `defaultWidth`).
- Make the store's start seed tenant-aware (`(tenant, prefix) → start` instead of `prefix → start`).
- Make the server's width formatting tenant-aware.
- No **BREAKING** changes: existing global `prefixes` and `tokens` configs keep working; the per-tenant block is opt-in.
- Document per-tenant overrides in the ID allocation server guide.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `id-allocation-server`: the requirements "Server honors a configured starting value per prefix" and "Padding honors configured width" change so the configured `start`/`width` resolve per tenant, falling back to the global prefix setting.

## Impact

- `id-server/src/config.ts` — new per-tenant prefix config key and type.
- `id-server/src/index.ts` — wire tenant-scoped `start`/`width` resolution.
- `id-server/src/store.ts` — `nextId` start lookup becomes tenant-aware.
- `id-server/src/server.ts` — width lookup becomes tenant-aware.
- `id-server/test/*` — tests for per-tenant overrides and fallback.
- Docs — `examples/tracer/modules/ROOT/pages/how-to/run-id-server.adoc`.
