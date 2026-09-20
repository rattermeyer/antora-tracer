## Why

Projects (tenants) on the ID allocation server are defined statically in `config.yml` and read once at startup. Adding or removing a team means editing the file and restarting the service. Multi-team setups need runtime project management — add, list, remove, update — without a restart, while single-team setups must stay zero-config.

## What Changes

- A project-management admin API on the server (`/admin/projects`), enabled only when an `adminToken` is configured.
- Projects move from the static `tokens` map into SQLite (a `projects` table) so they can be mutated at runtime without a restart.
- Tenancy resolution becomes DB-backed; token comparison becomes constant-time.
- Project tokens are stored hashed at rest; plaintext tokens are never persisted.
- A `projects` subcommand on the `antora-id-server` CLI (`list`, `add`, `update`, `remove`) drives the admin API.
- The single-team mode is preserved: no `adminToken` → no admin routes; no `tokens` → no auth, default tenant.
- TLS stays a deployment concern (terminate at the reverse proxy), not a server feature.

## Capabilities

### New Capabilities

- `id-server-project-management`: the admin API for managing projects at runtime — request contract, admin-token gating, project CRUD, and the CLI client.

### Modified Capabilities

- `id-allocation-server`: tenancy resolution reads projects from the database instead of a static config map.

## Impact

- **Package**: `@antora-tracer/id-server` — new admin routes, a `projects` table, and a CLI subcommand.
- **Config**: new `adminToken` key; the existing `tokens` map remains valid as an initial project set.
- **Security**: admin API requires a bearer `adminToken`; project tokens stored hashed; constant-time comparison.
- **Docker**: no image change — the admin API is reachable on the existing port; `/data` already persists the SQLite DB.
- **Docs**: extend the ID server how-to with project management and the single-team vs multi-team ladder.
- **Tests**: admin API HTTP tests (auth gating, CRUD, fail-closed), tenancy-from-DB, and constant-time comparison.
