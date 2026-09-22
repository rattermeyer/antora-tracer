## Context

The allocator keys counters by `(tenant, prefix)` (SQLite primary key on `counters`), but the start seed and padding width are resolved by prefix alone:

- `config.ts` exposes `prefixes: Map<string, PrefixConfig>` (prefix → `{width?, start?}`), a top-level key with no tenant dimension.
- `index.ts` splits it into `widths` (prefix → width) and `starts` (prefix → start).
- `store.ts` `nextId(tenant, prefix)` seeds with `starts.get(prefix) ?? 1`.
- `server.ts` formats with `prefixes.get(prefix) ?? defaultWidth`.

Because the counter is already keyed per tenant, the only thing missing for per-tenant parameters is making the *seed* and *width* lookups tenant-aware. The SQL schema needs no change.

## Goals / Non-Goals

**Goals:**

- Let an operator give different tenants different `start`/`width` for the same prefix.
- Keep existing global `prefixes` and `tokens` configs working unchanged (opt-in new key).

**Non-Goals:**

- Guaranteeing cross-tenant uniqueness automatically: this only gives the operator the *capability* to partition ranges; it does not prevent two tenants colliding if they share a start.
- Runtime management of per-tenant prefix settings through the admin API (deferred).
- Changing the core `seed` command: it keeps emitting global per-prefix seeds, which serve as the fallback.
- Changing the ID format (no tenant token in the returned ID).

## Decisions

**Decision 1: Add a top-level `tenantPrefixes` config key (opt-in), rather than nesting prefix settings under `tokens`.**

`tokens` is currently `tenant → token` (a string map). Nesting would break the `acme: acme-secret` shorthand and mix credentials with allocation config. A sibling key keeps both maps flat and backward compatible:

```yaml
tokens:
  acme: acme-secret
  beta: beta-secret
prefixes:                 # global fallback (unchanged)
  REQ: { width: 3, start: 55 }
tenantPrefixes:           # new: tenant -> prefix -> override
  beta:
    REQ: { start: 1000 }
```

Resolution for `(tenant, prefix)`: `tenantPrefixes[tenant][prefix]` → `prefixes[prefix]` → default (`1` / `defaultWidth`).

Alternatives rejected: nesting under `tokens` (breaks shorthand, mixes concerns); a per-tenant `prefix` mapping keyed by tenant (more invasive, restructures the existing `prefixes` block).

**Decision 2: Resolve start/width through functions, not nested maps threaded everywhere.**

The store's `nextId` and the server's formatting only need `(tenant, prefix) → number`. Pass each a resolver function so neither module learns the config shape. This keeps the existing store/server seams (already documented for a future Postgres/hosted backend) intact:

- `SqliteStore` constructor takes a `(tenant, prefix) => number` start resolver (replacing `starts: ReadonlyMap<string, number>`).
- `IdServerOptions.prefixes` becomes a `(tenant, prefix) => number` width resolver.

`index.ts` owns the config shape and builds both resolvers with the fallback chain above. Alternatives rejected: passing nested `Map<tenant, Map<prefix, …>>` into store and server (couples both to config structure); adding a new resolver interface (unnecessary — a plain function is the seam).

**Decision 3: Extract the existing per-prefix parsing into a shared helper.**

`config.ts` currently parses `prefixes` inline (number shorthand vs `{width?, start?}` object). Reuse the same parsing for `tenantPrefixes` values by extracting a `parsePrefixes(raw) → Map<string, PrefixConfig>` helper, so the two keys accept identical syntax.

## Risks / Trade-offs

- **Cross-tenant collision still possible.** Giving `acme` and `beta` the same prefix and same (or overlapping) start ranges still yields duplicate IDs if their namespaces merge. This change enables manual partitioning but does not enforce it. Documented in the how-to guide.
- **Constructor/option type change.** `SqliteStore`'s second parameter and `IdServerOptions.prefixes` change type. These are internal to the companion package and not a documented public contract; no external breakage expected.
- **Runtime-created tenants have no overrides.** A tenant added through the admin API falls back to global prefix settings until a `tenantPrefixes` entry is added and the server restarted (config is loaded at boot).
