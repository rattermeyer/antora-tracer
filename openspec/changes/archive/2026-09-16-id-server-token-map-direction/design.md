## Context

`tokens` currently maps `token → tenant` (the secret is the YAML key). That direction is unintuitive and caused a 401 when a config used `tenant → token`. See proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Put the secret in the value position (`tenant → token`).
- Keep resolution behavior unchanged (bearer token → tenant; 401 on absent/unknown).

**Non-Goals:**
- Multi-token-per-tenant or token rotation (still deferred).

## Decisions

### 1. `tenant → token` map with reverse lookup
Config parses `tokens` as `tenant → token` (interpolating the token value). `StaticTokenAuth.resolve` iterates the map and returns the tenant whose token equals the presented bearer token.
Rationale: the secret belongs in the value position; the map is tiny (a handful of tenants), so a linear scan is irrelevant at this throughput.
Alternative: keep `token → tenant` (rejected — the awkward key position is the bug).

## Risks / Trade-offs

- [Breaking config shape] existing `token → tenant` configs must be swapped → intended; the server is unreleased.
- [Linear scan] resolve is O(n) in tenant count → negligible at this scale; a hash index is the upgrade path if tenant counts grow.
