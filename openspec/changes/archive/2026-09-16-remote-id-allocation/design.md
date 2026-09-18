## Context

`next-id` (see `openspec/specs/next-id`) currently scans the local files under `-i` and returns `max+1` over matching `PREFIX-NNN` IDs via `TraceabilityGraph.getNextId`. The CLI reads config through `ConfigLoader` from `traceability.yml` (`DEFAULT_CONFIG_FILES`), auto-discovered or via `--config`. `createExtension(options)` in `cli.ts` is the single point where the CLI builds the extension from config.

Two config surfaces exist and must not be conflated: `traceability.yml` (the CLI surface, consumed here) and the Antora build config (`allowDuplicateIds` etc. in `antora-extension.ts`). This change touches only the CLI surface.

Merge-time duplicate detection already exists (`validate` promotes `duplicate_node` to errors; the build throws unless `allowDuplicateIds`). This change adds the *prevention* opt-in, not another detector.

## Goals / Non-Goals

**Goals:**
- Opt-in remote allocation via a config key, with local `max+1` unchanged when absent.
- Fail closed: never silently fall back to a local ID when an allocator is configured.
- A `--local` escape hatch for offline/debug use.
- No new runtime dependency.

**Non-Goals:**
- Implementing the allocator server. This change defines the client contract only.
- Reserving/committing IDs — the server owns that.
- Local gap-filling, non-numeric suffixes, or any change to local `getNextId` behavior.
- Role validation of the prefix — the server maps prefix → counter.

## Decisions

### 1. Config shape: top-level `idAllocation`

```yaml
idAllocation:
  endpoint: "https://ids.example.com"   # required when idAllocation present
  token: "..."                          # optional
```

Absent `idAllocation` → existing local behavior. Present → `endpoint` must be a non-empty HTTP(S) URL; `token` optional.

**Rationale**: Mirrors the flat top-level style of `roles`/`matrices`/`labels`. A nested block keeps the two allocator fields grouped without a new file.

### 2. Protocol: `GET {endpoint}/next-id?prefix=<prefix>`

Success → `200` with `{"id": "<PREFIX-NNN>"}`. The client prints `id` verbatim (padding and convention are the server's concern).

**Rationale**: A single GET is the smallest contract that returns one ID. The server owns the monotonic per-prefix counter and padding convention; the client just relays.

### 3. Fail closed on allocator errors

Configured allocator + any failure (non-2xx, network error, timeout, invalid/missing `id`) → exit 1, no ID emitted. **No silent local fallback.**

**Rationale**: Silent fallback would hand the author a locally-allocated ID while they believe it is server-allocated — reintroducing exactly the cross-branch collision this feature prevents. Erroring is the only safe behavior; `--local` is the explicit, non-silent escape hatch.

### 4. `--local` flag

`next-id --local` forces the existing local scan, ignoring `idAllocation`.

**Rationale**: A down server must not block authoring. An explicit flag (vs. editing config) is the cheap, non-silent opt-out.

### 5. Timeout via `AbortSignal.timeout`, Node built-in `fetch`

A 10-second request timeout using Node 20's global `fetch`.

**Rationale**: A hung allocator must not hang authoring. No new dependency — `fetch` and `AbortSignal.timeout` are available on Node 20+ (the declared runtime).

### 6. `mergeConfig` must carry `idAllocation`

`mergeConfig` (preset inheritance) rebuilds the result from an explicit field list; an unlisted key is dropped. Add `idAllocation: override.idAllocation ?? base.idAllocation` so a user's `idAllocation` survives `extends:`.

**Rationale**: Otherwise a user config that also `extends` a preset silently loses its allocator. Override-wins matches `labels`/`roleGuidance` semantics.

### 7. Environment interpolation in `idAllocation`

`${VAR}` references in `idAllocation.endpoint` and `idAllocation.token` are expanded against `process.env` during `normalizeConfig`. An unset variable throws (config load fails), so a missing secret can never send a literal `${...}` to the server.

**Rationale**: `token` is a secret and must not sit in a committed `traceability.yml`. Fail-closed matches the change's overall posture. Scope is deliberately `idAllocation`-only — no global interpolation — so existing config values containing `$` keep their current meaning. Presets never go through `normalizeConfig`, so a preset cannot inject or expand secrets; interpolation runs only on the user's file.

**Deliberate simplification**: no escape sequence. A literal `${...}` inside a token is unsupported and assumed absent.

### 8. Authentication failures are reported distinctly

The client maps HTTP status to message: `401`/`403` → "authentication failed (check `idAllocation.token`)", other non-2xx → "allocator returned HTTP <n>", network/timeout → "allocator unreachable".

**Rationale**: "bad token" and "server down" demand different author actions, and a generic message wastes the author's time. Purely a client-side message branch — no protocol or config change.

## Risks / Trade-offs

- **Adoption gap**: hand-typed IDs bypass the allocator. Merge-time duplicate detection remains the backstop; the server only helps authors who use `next-id`.
- **Server is a contract, not an implementation**: the client can only be tested against a stubbed HTTP server. Protocol drift between client and a future server is possible → captured as the spec's `GET /next-id?prefix=` contract.
- **Central point of failure**: a down allocator blocks `next-id` (by design, fail-closed). `--local` mitigates.
- **Reuse after deletion** remains the server's responsibility (monotonic counters); out of scope here.
