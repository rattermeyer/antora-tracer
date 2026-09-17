## Why

`next-id` computes the next ID by scanning the local files it is pointed at (`max+1` over the in-memory set). It cannot guarantee uniqueness across branches, machines, or history — two authors on different branches both get `REQ-004`, and deleted IDs are silently reused. When a team wants *prevention* (not just merge-time detection), there is no opt-in to a shared allocator.

## What Changes

- Add a top-level `idAllocation` config block (`endpoint`, optional `token`) to `traceability.yml`.
- `next-id` consumes it: when `idAllocation.endpoint` is set, it requests the next ID from the allocator instead of scanning locally.
- Fail closed: a configured-but-unreachable allocator errors out (exit 1) rather than silently falling back to a local, possibly-colliding ID.
- Add a `--local` flag to force the existing local scan even when an allocator is configured.
- Interpolate `${VAR}` environment references in `idAllocation.endpoint` and `idAllocation.token` at config load; an unset variable fails config load (keeps secrets out of the committed file).
- Distinguish authentication failures: a `401`/`403` response errors with an authentication-specific message instead of a generic allocator error.
- Absent `idAllocation`, behavior is byte-for-byte unchanged (local `max+1`).
- No server is built in this change — only the client contract and config surface. The allocator service itself is a follow-up.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `next-id`: config-driven remote ID allocation with fail-closed semantics and a `--local` override.

## Impact

- **Config**: New `idAllocation` key in `TraceabilityConfig`; normalization, env interpolation, validation, and preset merge must carry it.
- **CLI**: `next-id` gains remote allocation and a `--local` flag; the error path changes when an allocator is configured.
- **Docs**: `reference/configuration.adoc` (new option), `reference/cli.adoc` (new flag + behavior).
- **Dependencies**: None — uses Node 20 built-in `fetch`.
- **Tests**: `test/cli.test.ts` next-id block gains remote/fail-closed/`--local`/config-validation/auth-failure/env-interpolation cases.
