# Changelog

All notable changes to the Antora Requirements Traceability Extension.

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
