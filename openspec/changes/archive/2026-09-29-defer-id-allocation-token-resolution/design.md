## Context

See proposal.md for the motivation. `ConfigLoader.normalizeConfig()` currently interpolates both `idAllocation.endpoint` and `idAllocation.token` while loading any project configuration. The Antora extension uses this same loader to obtain matrix definitions and relationship rules. The CLI reads the resulting `idAllocation` only in `next-id`; `--local` bypasses the remote call.

## Goals / Non-Goals

**Goals:**
- Keep loading project configuration independent of whether an optional allocator token is present in the environment.
- Preserve endpoint validation and the current environment interpolation behavior when referenced variables exist.
- Make remote `next-id` the boundary that rejects a configured but unresolved token; let `--local` skip that requirement.

**Non-Goals:**
- Change allocator authentication semantics, introduce anonymous-remote fallback, or make network calls during site generation.
- Change `.env` loading or how endpoint URLs are configured.

## Decisions

- Defer token interpolation until the CLI selects remote allocation. Retain the token's configured value in loaded configuration so unrelated consumers can load the rest of the configuration. At the remote-call boundary, resolve environment references and fail with the missing variable's name before making a request. This preserves actionable errors without carrying unresolved credentials into an HTTP request.
- Keep endpoint interpolation and HTTP(S) validation in configuration loading. The endpoint is required to identify a valid configured allocator and is not secret; validating it does not require allocator access or credentials.
- Check `--local` before resolving the token. Local ID scanning does not use the allocator and should not depend on remote credentials.
- Add coverage at both boundaries: config/extension loading with the token unset, and CLI remote versus local behavior with the same unset token. Update the next-id contract and user-facing configuration guidance to describe this distinction.

Alternative considered: make all missing `${VAR}` references resolve to an empty string. Rejected because it erases which credential is missing and can accidentally turn a configuration error into an unauthenticated request. Alternative: catch missing-token errors only in the Antora extension. Rejected because it leaves other non-remote consumers coupled to a CLI-only credential and duplicates policy at a caller instead of the consumer that needs the secret.

## Risks / Trade-offs

- A caller that reads `idAllocation.token` outside remote `next-id` will now see the configured placeholder rather than an eagerly resolved value. Current repository consumers only use it for remote `next-id`; keep credential resolution explicit at that boundary.
- The resolver must preserve literal token values and resolve only supported `${NAME}` references. Reuse the existing interpolation semantics rather than introducing a second syntax.
- The missing-token error moves from generic config loading to remote `next-id`; retain the environment variable name in the CLI error for diagnosis.

## Migration Plan

No config format or persisted data changes. Existing builds with the token set continue to resolve it. Builds without it will load the project configuration normally; remote `next-id` without the token will fail at invocation. Rollback is a code revert; operators who still run the prior version can provide `TRACER_ID_TOKEN` in the environment.
