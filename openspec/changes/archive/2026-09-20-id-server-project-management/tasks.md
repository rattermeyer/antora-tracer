## 1. Storage

- [x] 1.1 Add a `projects` table (tenant, token_hash, created_at) to the SQLite store with create/read/update/delete methods, and verify a new store test exercises each method
- [x] 1.2 Add a sha256 token-hashing helper and verify a unit test covers hash-and-compare semantics

## 2. Tenancy

- [x] 2.1 Change tenancy resolution to look up the presented token against the projects table, and verify the existing `server.test.ts` tenancy scenarios still pass
- [x] 2.2 Replace string-equality token comparison with constant-time `timingSafeEqual` over sha256 digests, and verify the auth test still passes

## 3. Config and seeding

- [x] 3.1 Add the `adminToken` key to the config loader and verify a config test reads it
- [x] 3.2 Seed the `projects` table from the `tokens` config when it is empty, and verify a seed test covers the empty-DB and idempotent cases

## 4. Admin API

- [x] 4.1 Implement `GET/POST/PUT/DELETE /admin/projects` with the status codes from the spec, and verify HTTP tests cover list, add, duplicate, update, remove, and unknown-tenant cases
- [x] 4.2 Register the admin routes only when `adminToken` is set, returning `404` otherwise, and verify a test covers both the gated and absent cases

## 5. CLI

- [x] 5.1 Add `antora-id-server projects list|add|update|remove` as a thin client over the admin API, and verify by running `projects add` against a local server then hitting `/next-id` with the new token

## 6. Docs

- [x] 6.1 Extend the ID server how-to with project management and the single-team vs multi-team ladder, and verify the example site builds cleanly
