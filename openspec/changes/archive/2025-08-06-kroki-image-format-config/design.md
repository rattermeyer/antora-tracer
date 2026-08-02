## Context

The `krokiUrl` method generates Kroki image URLs with a hardcoded `format = "svg"` default. The format determines what image type Kroki returns. SVG works in browsers but not in `asciidoctor-pdf` (which uses Prawn, a PDF library that can't natively embed SVG).

The extension already has a config system (`AntoraTraceabilityConfig`) with playbook-level overrides. Adding `krokiImageFormat` to this config is the natural integration point.

## Goals / Non-Goals

**Goals:**
- Make Kroki image format configurable via extension config
- Default to SVG (backward compatible)
- PDF playbook uses PNG

**Non-Goals:**
- Per-document format override (use `kroki-default-format` AsciiDoc attribute for that)
- Auto-detecting PDF vs HTML builds

## Decisions

### Decision: Add to extension config, not AsciiDoc attributes

The `kroki-default-format` AsciiDoc attribute is set in the assembler config, which runs after the extension. Adding `krokiImageFormat` to the extension config (which the extension reads during initialization) ensures it's available when `krokiUrl` is called.

```typescript
// AntoraTraceabilityConfig
krokiImageFormat?: "svg" | "png";

// DEFAULT_CONFIG
krokiImageFormat: "svg",

// krokiUrl
private krokiUrl(type: string, source: string): string {
    const format = this.config.krokiImageFormat || "svg";
    // ...
}
```

### Decision: PDF playbook sets `krokiImageFormat: png`

```yaml
antora:
  extensions:
    - require: ./lib/src/antora-extension.js
      krokiImageFormat: png
```

The HTML playbook keeps the default (SVG).

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| PNG images are larger than SVG | Acceptable for PDF; HTML stays on SVG |
| PNG rendering at Kroki may be slightly slower | Kroki caches results; negligible in practice |
