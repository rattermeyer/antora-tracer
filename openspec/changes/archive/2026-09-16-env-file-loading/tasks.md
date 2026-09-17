## 1. Dependencies

- [x] 1.1 Add `dotenv@^17` to the core package dependencies and verify `npm install` succeeds
- [x] 1.2 Add `dotenv@^17` to the id-server package dependencies and verify `npm install` succeeds

## 2. Entry points

- [x] 2.1 Load `.env` at the top of `src/cli.ts` with `dotenv.config({ quiet: true })` (before `createExtension`); verify `npm run build` compiles
- [x] 2.2 Load `.env` at the top of `id-server/src/index.ts` with `dotenv.config({ quiet: true })` (before `loadConfig`); verify the id-server build compiles

## 3. Tests

- [x] 3.1 Test that a `.env` value resolves `${VAR}` interpolation; verify the case passes
- [x] 3.2 Test that an existing process-environment variable wins over `.env`; verify the case passes
- [x] 3.3 Test that `next-id` stdout stays a bare ID (no dotenv "injected env" log line); verify the case passes

## 4. Docs

- [x] 4.1 Document `.env` auto-loading in `reference/configuration.adoc` and `how-to/run-id-server.adoc`; verify the Antora site still builds
