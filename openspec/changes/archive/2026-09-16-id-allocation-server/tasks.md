## 1. Package scaffold

- [x] 1.1 Create the standalone server package (package.json, tsconfig, entry point) separate from core, and verify `npm run build` compiles the package
- [x] 1.2 Add `js-yaml` (runtime) plus `@types/node`, `@types/js-yaml`, `@types/mocha`, `@types/chai` (dev) and verify install succeeds — storage uses the built-in `node:sqlite`, no native dependency

## 2. Storage

- [x] 2.1 Define the `AllocatorStore` interface and `SqliteStore` with atomic upsert-increment; verify a unit test returns sequential IDs for repeated allocations
- [x] 2.2 Create the `counters` table on first open, idempotently; verify opening twice does not error

## 3. HTTP service

- [x] 3.1 Implement `GET /next-id?prefix=` returning `200` + `{"id": "..."}`; verify a request round-trip via a test client
- [x] 3.2 Define the `Auth.resolveToken(req) → tenant` seam and `StaticTokenAuth` impl (token map, absent → default tenant, unknown → `401`); verify the auth scenarios pass
- [x] 3.3 Apply per-prefix padding (configurable width, default 3, minimum not cap); verify width scenarios pass
- [x] 3.4 Return `400` for a missing/empty `prefix`; verify the error scenario passes

## 4. Tests

- [x] 4.1 Add a concurrency test asserting concurrent requests for one prefix receive distinct IDs; verify no collision
- [x] 4.2 Add fail-closed/error tests (`400`, `401`) and confirm no ID is allocated on error
- [x] 4.3 Test token→tenant and per-prefix width config loading; verify configuration scenarios pass

## 5. Docs

- [x] 5.1 Document server deployment and configuration in a reference or how-to page; verify the Antora site still builds

## 6. Seeding

- [x] 6.1 Parse an optional `start` in `prefixes` config and pass it to the store; verify a seeded prefix allocates from `start`
- [x] 6.2 Add a seed test (first allocation honors `start`, subsequent increments) and an unseeded default test
- [x] 6.3 Document the `start` option in the how-to page; verify the Antora site still builds
