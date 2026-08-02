## Why

`traceability:graph[]` and `traceability:graph-coverage[]` generate Kroki image URLs that always use SVG format. For PDF builds, SVG images cause "unrecognized image file format" errors because `asciidoctor-pdf` can't embed SVG natively. The `kroki-default-format` AsciiDoc attribute can't help — it's set in the PDF assembler config and only affects the Ruby `asciidoctor-kroki` gem, not the pre-generated image URLs from the tracer extension.

## What Changes

- Add `krokiImageFormat` config option to `AntoraTraceabilityConfig` (default: `"svg"`)
- `krokiUrl()` reads `this.config.krokiImageFormat` instead of hardcoding `"svg"`
- PDF playbook sets `krokiImageFormat: png`

## Capabilities

### Modified Capabilities

- `graph-visualization`: Kroki image format is now configurable via extension config, enabling PNG output for PDF builds.

## Impact

- **Files modified**: `src/antora-extension.ts` (config interface, default config, `krokiUrl` method), `antora-playbook-pdf.yml` (add `krokiImageFormat`)
- **No API changes**: Method signatures unchanged
