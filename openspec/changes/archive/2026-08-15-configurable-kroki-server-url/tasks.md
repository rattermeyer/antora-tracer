## 1. Configuration

- [x] 1.1 Add `krokiServerUrl?: string` to `AntoraTraceabilityConfig` interface in `src/antora-extension.ts`
- [x] 1.2 Add `krokiServerUrl: ""` to `DEFAULT_CONFIG`
- [x] 1.3 Add `krokiServerUrl: rc.krokiServerUrl || rc.krokiserverurl || ""` to config merging block in constructor

## 2. URL Generation

- [x] 2.1 Update `krokiUrl()` to use `process.env.KROKI_SERVER_URL || this.config.krokiServerUrl || "https://kroki.io"` as base URL
- [x] 2.2 Ensure trailing slash handling: if `krokiServerUrl` has a trailing slash, strip it before appending the path

## 3. Tests

- [x] 3.1 Add tests for default behavior (no config, URLs use `https://kroki.io`)
- [x] 3.2 Add tests for `krokiServerUrl` config option
- [x] 3.3 Add tests for `KROKI_SERVER_URL` env var override
- [x] 3.4 Add tests for env var > config precedence

## 4. Verification

- [x] 4.1 Run `npm test` — all tests pass (293 passing)
- [x] 4.2 Run `npm run build` — compiles cleanly
- [x] 4.3 Build example site (`--clean`) — pre-existing graph isolation issue ("No traceable items found") prevents matrix generation, not caused by this change; demo project builds verified separately
