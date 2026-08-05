# Changelog

All notable changes to the Antora Requirements Traceability Extension.

## [0.12.1] — 2026-08-06

### Fixed
- Partial file macros now expand correctly — `traceability:links[]`, `traceability:outgoing[]`, `traceability:graph[]`, and inline macros in partials are no longer left as raw text in rendered HTML
- Partial items in traceability matrices now link to the including page (`architecture.html#ARC-009`) instead of broken GitHub URLs
- ROOT module prefix no longer appears in same-module xref paths

### Changed
- Macro expansion consolidated — three near-identical methods (`expandOutgoingMacros`, `expandIncomingMacros`, `expandLinksMacros`) replaced by one `expandRelationMacros(file, macroName)`. Net reduction of ~500 lines
- Matrix HTML template split into Mustache partials (`styles`, `header`, `matrix-row`, `footer`). Dead `design-matrix` template and unused `MatrixGenerator` methods removed
- Extension initialization made synchronous, eliminating a race condition on early `contentClassified` events
- Per-item/per-file `console.log` noise replaced with injectable `TracerLogger` (defaults to no-op)

### Docs
- Four new PlantUML architecture diagrams: API overview (class), parser flow (activity), graph lifecycle (state), PreparedFile caching (activity)
- Two new quality attributes: QA-061 (Platform stability), QA-062 (Query performance)
- `update-example-site` skill expanded with diagram checklist and type decision guide

## [0.12.0] — 2026-08-06

### Added
- Kroki image format defaults to `svg` for HTML; `KROKI_IMAGE_FORMAT=png` env var for PDF builds

### Fixed
- Graph isolation per component version — items from one version no longer leak into another version's xref generation, preventing "target of xref not found" errors in multi-version builds
- Partial item xrefs use anchor-only references when source file is a partial path
- PDF build copies use dynamic component version from `examples/antora.yml` instead of hardcoded version

## [0.11.0] — 2026-08-06

### Added
- `toDot` traverses relationships bidirectionally — `traceability:graph[]` now shows items connected via both outgoing and incoming edges
- Lunr indexes item anchors — searching `REQ-002` in the docs links directly to `#REQ-002`
- Landing page uses conemso teal color palette and Roboto font, matching the documentation UI theme
- `use-case-engineering` skill for writing Wiegers-format use cases in AsciiDoc
- Config-driven inverse relationship labels (`inverseLabels` in traceability.yml)
- Relation type labels display underscores as dashes (e.g., `leads_to` → `leads-to`)
- AGENTS.md Consistency section documents cross-layer verification expectations
- Use case role (`use_case`) with `leads_to` relation in example site

### Fixed
- `traceability:graph[]` was missing items connected only via incoming edges
- CI: `patch-package` moved from `postinstall` script to explicit CI step, fixing `npm ci` failures
- Config: `inverseLabels` now correctly merge when extending a preset
- Parser: line-aware delimiter detection in `extractBody`

### Changed
- Use cases UC-001 through UC-005 rewritten in Karl Wiegers tabular format with pre/post conditions
- `traceability:graph[]` and `traceability:graph-coverage[]` documentation updated for clarity

## [0.10.0] — 2026-07-30

### Added
- `traceability:graph[]` macro renders Kroki GraphViz relationship diagrams for items
- `traceability:graph-coverage[]` macro renders Kroki Vega-Lite coverage bar charts
- `toDot(fromId, depth?)` and `toVegaLite(itemId?)` methods on `TraceabilityGraph`
- Circular reference detection in `validate()` — detects cycles in the relationship graph
- `next-id` CLI command returns the next available sequential ID for a given prefix
- `getNextId(prefix)` API method on `TraceabilityGraph`
- Partial file processing: items defined in `partials/` are now included in the graph with links to the source repository
- Automatic matrix sync to component `_attachments/traceability/` during `sitePublished`

### Fixed
- Graph and coverage macros in item titles no longer cause unterminated blocks
- `traceability:outgoing[]` and `traceability:incoming[]` inside backtick code spans are no longer expanded
- `DocumentParser` excludes `traceability:` namespace from inline relationship parsing
- `buildXref` uses `link:` instead of `xref:` for partial items with URL-based source files

### Changed
- Duplicate item ID warning now includes actionable fix suggestions (relationship macro or xref)
- Sphinx comparison page clarifies both tools are language-agnostic, distinguished by markup (reStructuredText/Markdown vs AsciiDoc)
- User guide documents both partial-defines-item and page-defines-item patterns

## [0.7.0] — 2026-07-27

### Added
- Unified `[item, id=X, role=Y]` block macro replaces role-specific macros
- YAML configuration system for roles, relations, and matrices
- Four built-in presets: `requirements-engineering`, `agile`, `medical-iec62304`, `minimal`
- Role-based relation validation at processing time
- Neo4j CSV and Cypher export with `Neo4jExporter`
- Mustache template rendering with `TemplateRenderer`
- Config-driven matrix generation with coverage calculation
- CLI commands: `process`, `matrix`, `validate`, `export neo4j`, `stats`, `preset`
- Graph query methods: `findPath`, `getImpactAnalysis`, `merge`, `getItemsWithRelationTo`
- `processFiles()` API for multi-file processing
- Comprehensive documentation: README, User Guide, Developer Guide
- Self-traceability example site with 36 requirements, arc42 architecture, test plan
- 183 tests covering all components

### Changed
- `RequirementsTraceabilityExtensionV2` renamed to `RequirementsTraceabilityExtension`
- Matrix generation now checks both forward and reverse relationship directions
- HTML matrix cells render multiple related items as a list inside one column cell
- Antora extension uses unified API directly (no v1/v2 split)

### Removed
- `[req]`, `[imp]`, `[test]`, `[doc]` block macros
- Hardcoded relation types (replaced by config-driven relations)
- Hardcoded matrix types (req-impl, req-test, full)
- `AsciidoctorExtension` class (replaced by `DocumentParser`)
- `--v2` CLI flag (unified architecture is default)
- v1 test files and source files

### Fixed
- `isRelationAllowed()` now uses `??` instead of `||` (preserves `false` returns from config loader)
- Matrix coverage calculation for reverse-direction (column→row) relationships
- HTML matrix table structure when multiple items relate to one row
