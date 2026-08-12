## 1. Configuration

- [ ] 1.1 Add `krokiServerUrl?: string` to `AntoraTraceabilityConfig` interface in `src/antora-extension.ts`
- [ ] 1.2 Add `krokiServerUrl: ""` to `DEFAULT_CONFIG`
- [ ] 1.3 Add `krokiServerUrl: rc.krokiServerUrl || rc.krokiserverurl || ""` to config merging block in constructor

## 2. URL Generation

- [ ] 2.1 Update `krokiUrl()` to use `process.env.KROKI_SERVER_URL || this.config.krokiServerUrl || "https://kroki.io"` as base URL
- [ ] 2.2 Ensure trailing slash handling: if `krokiServerUrl` has a trailing slash, strip it before appending the path

## 3. Tests

- [ ] 3.1 Add tests for default behavior (no config, URLs use `https://kroki.io`)
- [ ] 3.2 Add tests for `krokiServerUrl` config option
- [ ] 3.3 Add tests for `KROKI_SERVER_URL` env var override
- [ ] 3.4 Add tests for env var > config precedence

## 4. Verification

- [ ] 4.1 Run `npm test` — all tests pass
- [ ] 4.2 Run `npm run build` — compiles cleanly
- [ ] 4.3 Build example site with `npx antora antora-playbook.yml` — images still render
