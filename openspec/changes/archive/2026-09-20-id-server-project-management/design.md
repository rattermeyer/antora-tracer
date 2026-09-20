## Context

The id-server resolves tenancy from a static `tenant → token` map loaded once from `config.yml` at startup (`StaticTokenAuth`). The SQLite store only holds counters (`tenant, prefix, n`). Motivation and scope are in proposal.md — this document covers the how.

## Goals / Non-Goals

**Goals:**

- Mutate projects (add, list, update, remove) at runtime with no restart.
- Keep the single-team mode zero-config: no auth, no admin surface, no TLS.
- Keep the existing client contract (`GET /next-id`, bearer token) unchanged.

**Non-Goals:**

- Per-project prefixes or per-project ID ranges (prefixes stay global).
- TLS in the server — it stays a proxy concern.
- A hosted multi-tenant backend (accounts UI, self-service signup) — the `Auth` seam already reserves that path.
- Rate limiting, audit trails, or OAuth/OIDC login for the admin API.

## Decisions

### Projects live in the database, not the config file

Add a `projects` table (`tenant TEXT PRIMARY KEY, token_hash TEXT, created_at INTEGER`) to the existing SQLite store. Tenancy resolution reads it at request time.

- *Alternative — keep projects in config.yml and write back on change:* rejected. The Docker layout mounts config read-only, write-back needs a reload signal, and `fs.watch` on a bind mount is unreliable across hosts.
- *Alternative — cache the projects map and invalidate on admin write:* a per-request SQLite lookup is correct and fast enough for a low-traffic allocator; caching is a later optimization if profiling demands it.

### Admin API, not a config-file CLI + reload

`/admin/projects` endpoints mutate the DB directly; the CLI is a thin HTTP client.

- *Alternative — CLI edits config.yml and the server reloads on SIGHUP/fs.watch:* rejected for the same reasons as above (read-only config, watch fragility) plus it keeps a restart/reload step in every day-2 flow.

### Admin token is a separate config key, gating the whole surface

`adminToken: ${ADMIN_TOKEN}` in config. The admin routes are registered only when it is set — absent `adminToken` means the routes don't exist (404), so single-team mode has zero admin attack surface. A project token never grants admin access.

### Auth-off fallback is tied to the absence of an admin token

The `default`-tenant fallback (auth off) applies only when no `adminToken` is configured. With an admin token set, a project token is always required — even with zero projects — so removing the last project can never silently open the allocator.

### Tokens stored hashed, sha256

Store `sha256(token)`; verify by hashing the presented bearer token and comparing. Tokens are high-entropy (256-bit), so a single sha256 without salt is sufficient — rainbow tables don't apply, and argon2 is for low-entropy human passwords, not API keys. Consequence: `list` returns names only; tokens are write-only and rotated by re-setting.

### Constant-time comparison

Replace the existing `candidate === token` string equality with `crypto.timingSafeEqual` over `sha256` digests (hash-to-fixed-length first). This fixes a timing side-channel in the current `StaticTokenAuth.resolve`, applied to both project and admin checks.

### Config `tokens` seeds the database once

On first boot, if the `projects` table is empty, insert the `tokens` config entries (hashed). This keeps existing configs working (no migration step) while making the DB the source of truth thereafter. `tokens` is otherwise ignored — document that after first boot, changes go through the API.

### CLI subcommand shape

`antora-id-server projects list|add|update|remove` — a thin client over the admin API. Endpoint and admin token come from `--endpoint` / `--admin-token` flags, falling back to `ID_SERVER_ENDPOINT` / `ID_SERVER_ADMIN_TOKEN` env vars.

## Risks / Trade-offs

- [Admin API is a new remote attack surface] → gated on `adminToken`; absent token = routes don't exist; recommend TLS at the proxy when exposed beyond a trusted network.
- [Hashed tokens can't be recovered] → accepted; rotation is a re-set, and `list` showing names only is the desired posture.
- [Seed-once semantics can drift from config] → document that `tokens` config applies only when the table is empty; runtime state wins.
- [Concurrent admin writes] → SQLite serializes writes; add/update use `INSERT … ON CONFLICT` / `UPDATE` with duplicate detection returning `409`.
- [Per-request DB lookup] → negligible at allocator traffic levels; cache later if it ever matters.

## Migration Plan

- Deploy the new version; on first boot the server creates the `projects` table and seeds it from `tokens`. The `counters` table is untouched — no data loss, no downtime beyond the redeploy.
- Rollback: redeploy the previous version; the extra `projects` table is ignored by old code, and tenancy falls back to config `tokens`.

## Open Questions

- Whether to surface an audit log line per admin mutation — defer until a team asks; the design doesn't block on it.
