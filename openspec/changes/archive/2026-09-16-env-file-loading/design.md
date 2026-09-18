## Context

Config interpolation already reads `process.env` (see the archived `remote-id-allocation` change and the id-server). Neither tool populates `process.env` from a `.env` file, so the token must be sourced/exported manually. See proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Load `.env` at the two entry points before config is read.
- Never override an existing process-environment variable.

**Non-Goals:**
- Loading `~/.env` or any parent-directory search — only the working directory `.env`.
- The Antora extension embedding the library (library code must not side-effect `process.env`).

## Decisions

### 1. Mechanism: dotenv
Use the `dotenv` package in both packages. It is the standard, handles quoting/comments/`export` syntax (v17+), and works on Node 20 (the core floor), unlike Node's built-in `process.loadEnvFile` (Node 21.7+).
Call `dotenv.config({ quiet: true })` — dotenv v17 logs "injected env …" to stdout by default, which would pollute `next-id`'s bare-ID stdout and `--json` output.
Alternative: `process.loadEnvFile` (zero-dep, but breaks the core's Node 20 floor); a hand-rolled loader (zero-dep, but re-implements edge cases dotenv already solves).

### 2. Load at entry points, not in the library
`src/cli.ts` and `id-server/src/index.ts` call `dotenv.config()` at the top. The config loaders themselves stay side-effect-free.
Rationale: the core is embedded in Antora as a library; a library must not mutate `process.env` on import.

### 3. Working-directory `.env`, no override
`dotenv.config()` defaults to `process.cwd()/.env` and does not override existing variables — both defaults are kept.
Rationale: matches dotenv convention and the 12-factor rule that the real environment wins.

### 4. `export` syntax is accepted
dotenv v17+ parses `export KEY=value`; pin `dotenv@^17` so the user's existing `export TRACER_ID_TOKEN=…` file works unchanged. If v17 behavior differs, fall back to documenting bare `KEY=value`.

## Risks / Trade-offs

- [cwd coupling] `.env` is resolved from the working directory; invoking the CLI from elsewhere misses it → matches dotenv convention; document it.
- [side-effect scope] only entry points load `.env`; library consumers must set the environment themselves → intended.
- [override semantics] `.env` never overrides process env; a stale exported value can shadow `.env` → intended (documented).
