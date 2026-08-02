## Context

Release 0.11.0 follows the established release process. The project uses semantic versioning with Conventional Commits. This is a minor version bump (new features, no breaking changes).

## Goals / Non-Goals

**Goals:**
- Bump version to 0.11.0
- Document all changes since 0.10.0 in CHANGELOG.md
- Create annotated git tag v0.11.0
- Publish to npm

**Non-Goals:**
- No code changes — all feature work is already merged
- No spec changes — all deltas already synced to main specs
- No breaking changes

## Decisions

### Decision: Minor version bump

New features added since 0.10.0:
- Bidirectional graph traversal in `toDot`
- Lunr item-anchor indexing for search
- Landing page conemso theme
- Use-case-engineering skill

No breaking changes. Semantic versioning dictates a minor bump: `0.10.0` → `0.11.0`.

### Decision: Changelog format follows Keep a Changelog

Sections: Added, Fixed, Changed. Each entry references the relevant commit or PR.

## Changelog entries

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
- `traceability:graph[]` was missing items connected only via incoming edges (e.g., architecture items addressing requirements linked from use cases)
- CI: `patch-package` moved from `postinstall` script to explicit CI step, fixing `npm ci` failures
- Config: `inverseLabels` now correctly merge when extending a preset
- Parser: line-aware delimiter detection in `extractBody`

### Changed
- Use cases UC-001 through UC-005 rewritten in Karl Wiegers tabular format with pre/post conditions
- `traceability:graph[]` and `traceability:graph-coverage[]` documentation updated for clarity
