## 1. Config: parse tenant-scoped prefix settings

- [x] 1.1 Extract the per-prefix parsing in `id-server/src/config.ts` into a `parsePrefixes(raw)` helper reused by both `prefixes` and the new `tenantPrefixes` key (number shorthand and `{width?, start?}` object). Verify: `npm run build` in `id-server/` succeeds.
- [x] 1.2 Add `tenantPrefixes: Map<string, Map<string, PrefixConfig>>` to `IdServerConfig` and populate it from the `tenantPrefixes` YAML key, defaulting to empty. Verify: a config with `tenantPrefixes` loads without error.

## 2. Make start and width resolution tenant-aware

- [x] 2.1 Change `SqliteStore`'s constructor from `starts: ReadonlyMap<string, number>` to a `(tenant, prefix) => number` start resolver, and use it in `nextId`. Verify: existing `store.test.ts` passes.
- [x] 2.2 Change `IdServerOptions.prefixes` to a `(tenant, prefix) => number` width resolver and use it in the `/next-id` handler. Verify: `npm run build` in `id-server/` succeeds.
- [x] 2.3 In `id-server/src/index.ts`, build the two resolvers with fallback `tenantPrefixes → prefixes → default (1 / defaultWidth)` and wire them into `SqliteStore` and `createIdServer`. Verify: `npm test` in `id-server/` passes.

## 3. Tests

- [x] 3.1 Add a store test: tenant override `start` for a prefix is used, global `start` is the fallback, and two tenants advance independently for the same prefix. Verify: new test passes via `npm test`.
- [x] 3.2 Add a server test: `/next-id` returns a tenant-overridden width and start for the same prefix across two tokens, and falls back to global width when no override exists. Verify: new test passes via `npm test`.

## 4. Docs

- [x] 4.1 Document the `tenantPrefixes` key and its fallback semantics in `examples/tracer/modules/ROOT/pages/how-to/run-id-server.adoc`, including the manual-partitioning caveat. Verify: `npx antora antora-playbook.yml` builds without warnings.
- [x] 4.2 Add a `tenantPrefixes` example to `id-server/config.example.yml`. Verify: `npm run build` in `id-server/` succeeds and the example is valid YAML.

## 5. Verification

- [x] 5.1 Run `npm run lint` and `npm test` in `id-server/`. Verify: both pass.
- [x] 5.2 Smoke-test: start the server with a config seeding two tenants and offset `tenantPrefixes` starts, then request `GET /next-id?prefix=REQ` with each token and confirm distinct non-colliding IDs. Verify: observed responses match the spec scenarios.
