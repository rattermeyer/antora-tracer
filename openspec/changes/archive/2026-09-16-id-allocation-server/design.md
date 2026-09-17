## Context

The client contract is fixed (see the archived `remote-id-allocation` change): `GET /next-id?prefix=` with optional bearer token, `200` + `{"id": "PREFIX-NNN"}`, fail-closed on the client. This design covers the service behind that contract. The repo has no existing server or database footprint — the core package ships only the extension and CLI. See proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Collision-free, monotonic allocation — the atomicity invariant.
- Zero web framework: Node's built-in `http`.
- A storage seam so SQLite (now) can swap to Postgres (later) without touching HTTP/auth.
- An auth seam so a hosted multi-tenant backend (accounts + API keys) can be added later without touching the counter or route.
- Implicit tenancy via bearer token, matching the shipped client.

**Non-Goals:**
- Reservation/commit or ID reclamation — allocate-on-GET burns IDs permanently.
- Horizontal scaling or multi-instance coordination (a single writer is assumed).
- A management UI, admin API, or token rotation.
- Building the hosted auth backend now — accounts, login, API-key issuance, and rate limiting are deferred until a hosted deployment exists; the auth seam only keeps that path open.

## Decisions

### 1. Allocate-on-GET (no peek, no lease)
Every request increments the counter and returns it. The client only prints the ID; a peek is racy and a lease/commit needs a client change. Cost accepted: speculative `next-id` calls burn IDs — gaps are permanent by design.
Alternatives: peek (racy under concurrency), lease with TTL (client change), commit-on-write (client change).

### 2. Atomicity via upsert-increment in one SQL statement
`INSERT ... ON CONFLICT (tenant, prefix) DO UPDATE SET n = n + 1 RETURNING n`. One statement, correct under concurrency in both SQLite and Postgres — no read-then-write, no application-level lock.

### 3. Storage seam: one-method interface
`AllocatorStore.nextId(tenant, prefix): Promise<number>`. SQLite impl now; Postgres impl later. Kept to one method to avoid a speculative repository layer — the seam is justified because a second backend is an explicit future requirement, not a guess.

### 4. SQLite driver: node:sqlite
Node's built-in `node:sqlite` (`DatabaseSync`) — zero runtime dependency, synchronous, supports `RETURNING`, and is typed by `@types/node`. The server is a separate package that declares `engines.node >= 22.5` without affecting the Antora extension/CLI, which stay on Node 20.
Alternative: `better-sqlite3` (native) — keeps a Node 20 floor, but adds a native build/ABI maintenance burden for a self-hosted server most deployments run on current Node.

### 5. Tenancy via token mapping, absent token = default
Config maps `token → tenant`. Unknown token → `401`; no token → default tenant. Matches the client's optional token and its `401`/`403` → "authentication failed" handling.
Alternative: explicit `?tenant=` — would change the shipped client contract.

### 6. Padding: configurable per-prefix width, default 3
`padStart(width, "0")` applied as a minimum. The server cannot infer width (no file access), so it must be configured; default 3 matches local `getNextId`'s default.
Alternatives: client-sends-width (contract change); fixed global 3 (no 4-digit teams).

### 7. Schema
`counters(tenant TEXT, prefix TEXT, n INTEGER DEFAULT 0, width INTEGER DEFAULT 3, PRIMARY KEY(tenant, prefix))`.

### 8. Auth is a seam, not inline
Tenancy resolution lives behind `Auth.resolveToken(req) → tenant`, not in the route handler. v1 ships `StaticTokenAuth` (config `token → tenant` map, absent token → default tenant). A future hosted deployment swaps in `AccountApiKeyAuth` (accounts + API keys, absent/unknown token → `401`) without touching the counter or route.
Rationale: hosting is a stated future direction. The seam confines the default-tenant behavior to one implementation rather than baking it into the HTTP layer, so the hosted backend can reject anonymous requests cleanly.
Alternatives: inline token→tenant in the route (cheapest now, but hosting rewrites the route); build accounts/API-key auth now (premature — no hosted deployment exists).

### 9. HTTP layer: Node built-in `http`
The service has one route; Node's built-in `http` parses and responds without a framework. The route is already isolated behind the auth and store seams, so swapping to a framework later is mechanical, not architectural.
Alternative: `hono` (TypeScript-first, ~10KB, runs unchanged on edge/serverless) — revisit only if the hosted deployment targets edge runtimes; not worth a dependency for one route today.

### 10. Package layout: sibling directory, no workspaces
The server ships as a sibling `id-server/` directory with its own `package.json`, published independently as `@antora-tracer/id-server`. It shares no code with core (the store/auth types are server-internal), so there is no code-sharing pressure to justify npm workspaces.
Alternative: npm workspaces — deferred until a third package appears, when the shared lockfile and hoisting pay for themselves.

### 11. Seeding via per-prefix `start`
A prefix may configure a `start` value (`prefixes: { REQ: { width: 3, start: 55 } }`). The store uses it as the initial `n` on the counter's first allocation instead of 1; later allocations increment normally.
Rationale: teams adopting the server already have local IDs; seeding lets the server continue from their sequence instead of colliding at `REQ-001`.
Caveat: `start` is per-prefix, not per-(tenant, prefix), so it applies uniformly to all tenants. This serves the single/default-tenant migration case; per-tenant starting points are the management-CLI path (v2).
Alternatives: a management CLI `seed` command (more general, deferred); raw SQL (manual, undocumented).

## Risks / Trade-offs

- [Burned IDs] speculative `next-id` consumes IDs → accepted by design; document clearly so it is not later "fixed" with reuse.
- [Single writer] SQLite serializes writes → fine at author-tool throughput; the Postgres seam is the escape hatch if contention ever matters.
- [Counter reset on DB loss] deleting the SQLite file resets counters → backups; document restore implications.
- [Static token→tenant config] adding a tenant means editing config → acceptable for v1; a `tokens` table is a later upgrade.

## Migration Plan

New standalone package — no existing data to migrate. Deploy by running the service and pointing `idAllocation.endpoint` at it. Rollback: stop the service; clients fail closed or use `--local`.
