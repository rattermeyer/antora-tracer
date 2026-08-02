## Why

When building a site with multiple component versions (e.g., `v0.10.x` and `v0.11.x`), the `TraceabilityGraph` accumulates items from all versions into a single shared graph. During xref generation, this causes the extension to generate cross-references to pages that don't exist in the current version — for example, `xref:use-cases.adoc#UC-001` from a `v0.10.x` page, when `use-cases.adoc` only exists in `v0.11.x`. Asciidoctor can't resolve these xrefs because Antora xrefs are version-scoped, producing "target of xref not found" errors.

Disabling the extension makes the build succeed because relationship macros are left as plain text instead of being expanded to unresolvable xrefs.

## What Changes

- `registerContentClassifier()` groups page files by component version before processing
- The graph is cleared between component versions so items from one version don't leak into another
- Processing order: for each version → clear graph → process files → expand macros → substitute links
- Cross-version xrefs are avoided since each version builds its own self-contained traceability graph

## Capabilities

### Modified Capabilities

- `traceability-links-macro`: Relationship macro expansion is now scoped per component version, ensuring generated xrefs only target pages that exist in the same version.

## Impact

- **File modified**: `src/antora-extension.ts` — `registerContentClassifier` method
- **No API changes**: Extension API unchanged; CLI commands unaffected
- **Single-version builds**: No behavioral change — the graph was already cleared implicitly
