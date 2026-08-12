## Context

The `traceability:graph[]` and `traceability:graph-coverage[]` macros render Kroki diagrams by encoding GraphViz or Vega-Lite source into a URL. Currently the base URL is hardcoded to `https://kroki.io` in `krokiUrl()` (`src/antora-extension.ts:662`). Users with a local Kroki server (Docker, air-gapped environments) cannot override this.

The extension already supports `krokiImageFormat` (configurable via both config option and `KROKI_IMAGE_FORMAT` env var). This change follows the same pattern for the server URL.

## Goals / Non-Goals

**Goals:**
- Allow users to point `traceability:graph[]` and `traceability:graph-coverage[]` macros at a custom Kroki server
- Follow the existing precedence pattern: env var > extension config > default
- Default behavior unchanged (`https://kroki.io`)

**Non-Goals:**
- Does not affect standard AsciiDoc `kroki::` or `blockdiag::` macros (those use `kroki-server-url` AsciiDoc attribute)
- Does not provide per-URL or per-macro overrides

## Decisions

### Config option name: `krokiServerUrl`

Follows existing `krokiImageFormat` naming convention (`kroki` + CamelCase). Accepts a full base URL string.

### Env var: `KROKI_SERVER_URL`

Follows existing `KROKI_IMAGE_FORMAT` naming convention. Checked first for consistency with `krokiUrl()` which already checks `process.env.KROKI_IMAGE_FORMAT` before the config value.

### Precedence: env var > Antora config > default

```typescript
private krokiUrl(type: string, source: string): string {
    const serverUrl = process.env.KROKI_SERVER_URL || this.config.krokiServerUrl || "https://kroki.io";
    const format = process.env.KROKI_IMAGE_FORMAT || this.config.krokiImageFormat || "svg";
    const compressed = deflateSync(Buffer.from(source, "utf-8"));
    const encoded = Buffer.from(compressed).toString("base64url");
    return `${serverUrl}/${type}/${format}/${encoded}`;
}
```

This matches the existing `krokiImageFormat` pattern and is trivially testable.

### Config merging follows existing pattern

The constructor merges `krokiServerUrl` with lowercase fallback, identical to how `krokiImageFormat` is handled:

```typescript
krokiServerUrl: rc.krokiServerUrl || rc.krokiserverurl || undefined,
```

`undefined` means "use default" (no override). Unlike `krokiImageFormat` (which defaulted to `"svg"`), `krokiServerUrl` stays optional — if absent, the `krokiUrl()` method falls back to `https://kroki.io`.

## Risks / Trade-offs

- **TLS/HTTPS**: User must configure the URL correctly. A local server likely uses `http://localhost:8000`. No automatic protocol enforcement — user responsibility.
- **Path structure**: Assumes the Kroki server uses the standard path convention (`/<type>/<format>/<encoded>`). Non-standard servers are out of scope.
