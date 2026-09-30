## Why

Traceability links to items defined in partials currently fall back to the partial source or a same-page anchor.
Partials are not published as Antora pages, so links such as the generated UC-007 link do not navigate to the rendered use-case page.

## What Changes

- Resolve each partial-defined item to the Antora page that includes the partial.
- Preserve the item's source partial as provenance while recording the rendered page separately for link generation.
- Generate cross-component and cross-module AsciiDoc xrefs using the item's component, module, and including page.
- Generate matrix and attachment links to the same published page.
- Use the explicit item anchor, such as `#UC-007`, rather than a generated heading anchor.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `automatic-traceability-links`: Partial-defined items resolve to their including Antora page.
- `generate-matrix-item-links`: Matrix and attachment links use the rendered page for partial-defined items.

## Impact

- `src/types.ts` may gain rendered-page provenance only if the existing item metadata cannot represent it.
- `src/antora-extension.ts` must discover partial include relationships and pass the resolved page context to link generation.
- `src/LinkResolver.ts` must stop treating partial source paths as published documents.
- `src/MatrixGenerator.ts` behavior should remain unchanged apart from receiving correct item links.
- Add regression coverage for AsciiDoc xrefs and generated HTML links.
- No new dependencies, public CLI options, or user-facing configuration are required.
