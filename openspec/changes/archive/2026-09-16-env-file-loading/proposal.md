## Why

Config values like `idAllocation.token` support `${VAR}` interpolation against `process.env`, but nothing populates `process.env` from a `.env` file. Teams keep the token in `.env` and must remember to `source` it, `export` it, or pass `--env-file=` — otherwise the CLI and id-server both fail with "Environment variable … is not set". A project-local `.env` should be loaded automatically at startup.

## What Changes

- Load a `.env` file from the working directory into `process.env` at the entry points of both the CLI and the id-server.
- Loading happens before configuration is read, so `${VAR}` interpolation in `traceability.yml` and the id-server config resolves `.env` values.
- An existing process-environment variable takes precedence over a `.env` value (`.env` never overrides).
- A missing `.env` file is not an error.

## Capabilities

### New Capabilities

- `env-file-loading`: loading a `.env` file into the process environment at startup, for both the CLI and the id-server.

### Modified Capabilities

_None._

## Impact

- **Core package**: `dotenv` runtime dependency; load `.env` at the CLI entry (`src/cli.ts`) before config loading.
- **id-server package**: `dotenv` runtime dependency; load `.env` at `id-server/src/index.ts` before config loading.
- **Docs**: `reference/configuration.adoc` and `how-to/run-id-server.adoc` note that a `.env` file is loaded automatically.
- **Tests**: `.env` loading is honored; process env wins over `.env`; missing `.env` is a no-op.
