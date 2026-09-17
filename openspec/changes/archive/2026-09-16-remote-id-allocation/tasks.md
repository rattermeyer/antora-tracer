## 1. Config surface

- [x] 1.1 Add `idAllocation?: { endpoint: string; token?: string }` to `TraceabilityConfig` in `src/config/TraceabilityConfig.ts`
- [x] 1.2 Normalize the nested `idAllocation` shape in `normalizeConfig`
- [x] 1.3 Interpolate `${VAR}` references in `idAllocation.endpoint`/`idAllocation.token` against `process.env`; throw on an unset variable
- [x] 1.4 Validate `idAllocation.endpoint` (non-empty HTTP(S) URL) in `validateConfig`
- [x] 1.5 Add `idAllocation: override.idAllocation ?? base.idAllocation` to `mergeConfig` so preset inheritance preserves it
- [x] 1.6 Verify: `npm test` config-loader cases pass; add cases for valid/invalid `idAllocation` and env interpolation

## 2. Client + CLI

- [x] 2.1 Add a `fetchNextId(endpoint, token, prefix, timeoutMs)` helper that GETs `{endpoint}/next-id?prefix=` with `Authorization: Bearer` when token set, and throws on non-2xx / network error / timeout / missing `id`; map `401`/`403` to an authentication-specific message
- [x] 2.2 Wire `next-id` action: when `idAllocation.endpoint` is set and `--local` is absent, call the helper; on throw, `console.error` + exit 1 (fail closed)
- [x] 2.3 Add a `--local` flag to the `next-id` command
- [x] 2.4 Keep the local `getNextId` path byte-for-byte unchanged when `idAllocation` is absent or `--local` is set
- [x] 2.5 Verify: `npm run build` compiles; `npm test` next-id cases still pass

## 3. Tests

- [x] 3.1 Add a stub HTTP server in `test/cli.test.ts` (or a shared test util) returning `{"id":"REQ-055"}` and asserting the request path/query and bearer header
- [x] 3.2 Test remote allocation returns the server's `id` verbatim and exits 0
- [x] 3.3 Test fail-closed: non-2xx, network error, and missing-`id` body each exit 1 with no ID emitted
- [x] 3.4 Test `--local` bypasses a configured allocator
- [x] 3.5 Test invalid `idAllocation.endpoint` fails config load
- [x] 3.6 Test `${VAR}` interpolation resolves endpoint/token, and an unset variable fails config load
- [x] 3.7 Test a `401`/`403` response exits 1 with an authentication-specific message
- [x] 3.8 Verify: `npm test` (full suite) green

## 4. Documentation

- [x] 4.1 Document `idAllocation` in `examples/tracer/modules/ROOT/pages/reference/configuration.adoc` (next to sibling config options), including `${VAR}` interpolation and fail-closed auth messaging
- [x] 4.2 Document the `--local` flag and remote behavior in `examples/tracer/modules/ROOT/pages/reference/cli.adoc`
- [x] 4.3 Verify: Vale-linted prose (`pre-commit`) and `npx antora antora-playbook.yml` still builds
