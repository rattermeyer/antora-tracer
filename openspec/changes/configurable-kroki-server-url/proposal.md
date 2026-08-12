## Why

The `traceability:graph[]` and `traceability:graph-coverage[]` macros hardcode `https://kroki.io/` as the Kroki server URL, making the extension unusable in air-gapped environments and adding unnecessary dependency on a public service when a local Kroki instance is available.

## What Changes

- Add `krokiServerUrl` extension config option to override the Kroki server base URL
- Support `KROKI_SERVER_URL` environment variable as a fallback
- Default remains `https://kroki.io` for backward compatibility
- Update `krokiUrl()` to use the configurable URL instead of the hardcoded value

## Capabilities

### New Capabilities
- `kroki-server-url-config`: configurable Kroki server URL via extension config and environment variable

### Modified Capabilities
- `graph-visualization`: traceability:graph[] and traceability:graph-coverage[] macros now respect the configured Kroki server URL instead of hardcoding kroki.io

## Impact

- `src/antora-extension.ts`: `krokiUrl()` method, config merging in constructor
- `AntoraTraceabilityConfig` interface: add `krokiServerUrl?: string`
- Documentation: how-to pages covering Kroki macros
- No breaking changes: default behavior unchanged
