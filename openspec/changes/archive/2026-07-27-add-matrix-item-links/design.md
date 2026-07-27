## Context

The Antora Tracer extension generates traceability matrices as HTML files. Currently, these matrices display item IDs and titles as plain text. Items are stored with `sourceFile` containing the full Antora source path (e.g., `modules/ROOT/pages/architecture.adoc`). The matrices are output to `_attachments/traceability/` in Antora builds and `attachments/traceability/` in CLI usage. Items in the rendered HTML have fragment identifiers matching their IDs (e.g., `#REQ-001`).

## Goals / Non-Goals

**Goals:**
- Enable one-click navigation from any matrix item to its source definition
- Support both Antora build context and CLI context
- Maintain backward compatibility (no links when LinkResolver not provided)
- Handle items in subdirectories (e.g., `traceability/index.adoc`)
- Preserve existing matrix styling and layout

**Non-Goals:**
- Add line number anchors to links
- Open links in new tabs/windows
- Modify CSV or JSON matrix outputs
- Add interactive viewer features (Level 5)
- Track link clicks or add analytics

## Decisions

### Normalize `sourceFile` at Parse Time
**Decision**: Extract path relative to `pages/` directory and store in `sourceFile` (e.g., `architecture` or `traceability/index`).

**Rationale**:
- Simplifies link generation logic
- Removes dependency on Antora's internal path structure
- Consistent for both Antora and CLI contexts
- Original full path not needed for any existing functionality

**Alternatives Considered**:
- Store both full and relative paths: Adds complexity to Item interface without benefit
- Compute relative paths at link generation time: Requires parsing Antora paths, more error-prone

### Create Dedicated LinkResolver Component
**Decision**: Introduce a new `LinkResolver` class to centralize link generation logic.

**Rationale**:
- Separates concerns (path resolution vs. matrix generation)
- Makes link generation configurable for different contexts
- Easy to test in isolation
- Can be extended for future use cases (e.g., GitHub links)

**Alternatives Considered**:
- Add link generation directly in MatrixGenerator: Mixes concerns, harder to test
- Use template helpers: Mustache doesn't support complex logic in templates

### Context-Aware Relative Paths
**Decision**: Use configurable `relativePathPrefix` in LinkResolver (`../../` for Antora, `../../pages/` for CLI).

**Rationale**:
- Handles both Antora and CLI directory structures
- Simple string configuration
- No need for complex path computation at runtime

**Alternatives Considered**:
- Auto-detect context: Unreliable, adds complexity
- Use absolute URLs: Requires base URL configuration, less portable

### Links on Both Row and Cell Items
**Decision**: Generate links for both row items (requirements) and cell items (architecture, tests, etc.).

**Rationale**:
- Complete navigation experience
- Users may want to jump to either the requirement or its implementation/test
- Minimal additional implementation effort

### Tooltip for Source File
**Decision**: Show source file name as tooltip on link hover.

**Rationale**:
- Provides context without cluttering UI
- Helps users understand where the link will take them
- Uses standard HTML `title` attribute

**Alternatives Considered**:
- Show source file inline: Clutters the matrix
- Omit source file: Less transparent

### Same-Tab Navigation
**Decision**: Links open in the same browser tab.

**Rationale**: User preference. Maintains navigation flow and allows using browser back button.

## Risks / Trade-offs

**[Risk] Breaking existing code that depends on full `sourceFile` paths** → Mitigation: This is a behavioral change but the full path information can still be derived. Document as a minor change. No known consumers of `sourceFile` in current codebase.

**[Risk] Antora path structure changes in future versions** → Mitigation: The `_attachments/` prefix has been consistent across Antora versions. If it changes, `relativePathPrefix` can be updated in configuration.

**[Risk] Subdirectory path extraction fails for edge cases** → Mitigation: Fallback to basename-only extraction with warning. Test with various path formats.

**[Risk] CLI and Antora contexts produce different link structures** → Mitigation: Different `relativePathPrefix` values handle this. Document the configuration for each context.

## Migration Plan

No migration needed. The change is additive:
- Existing matrices without LinkResolver render as before
- New matrices with LinkResolver include clickable links
- No database migrations or data transformations required

## Open Questions

None. All design decisions have been resolved through exploration.
