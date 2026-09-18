## Why

The `remote-id-allocation` change shipped the *client* contract — `next-id` can request an ID from a remote allocator — but no allocator exists, so the feature is unusable without a team building their own server. This change ships the server so remote allocation works end-to-end out of the box.

## What Changes

- A new standalone allocator service (separate npm package) implementing `GET /next-id?prefix=<prefix>`.
- Atomic monotonic ID allocation per `(tenant, prefix)`: every request increments a counter and returns the result, so two concurrent requests never collide.
- Allocate-on-GET semantics: each request permanently consumes an ID (gaps are never reused).
- Implicit tenancy: a bearer token maps to a tenant; an absent token maps to a default tenant.
- Auth resolution behind a small seam so a hosted multi-tenant backend (accounts + API keys) can be added later without touching the counter or route.
- Fixed per-prefix padding width, configurable, defaulting to 3 digits (a minimum — counters grow past it, they never truncate).
- SQLite storage with a narrow store interface so a Postgres backend can be added later without touching the HTTP layer.
- No change to the core extension or CLI — the client contract already shipped and is unchanged.

## Capabilities

### New Capabilities

- `id-allocation-server`: the allocator HTTP service — request contract, atomic allocation, tenancy, padding, and storage semantics.

### Modified Capabilities

_None._

## Impact

- **Package**: a new npm package (e.g. `@antora-tracer/id-server`) separate from `@antora-tracer/core`.
- **Dependencies**: zero native deps — Node's built-in `node:sqlite` (storage) and `http` (server), plus `js-yaml` for config. No web framework.
- **Runtime**: standalone Node process; not part of the Antora extension or CLI.
- **Docs**: a new how-to/reference page for deploying and configuring the server.
- **Tests**: HTTP integration tests against the service with a real SQLite file, plus concurrency and fail-closed cases.
