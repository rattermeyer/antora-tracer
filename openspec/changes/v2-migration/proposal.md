# Proposal: Remove v1 Implementation and Migrate to v2-Only

## Summary

This proposal recommends removing the v1 implementation and making v2 the only version. The v2 implementation is now complete, tested, and functional. Keeping both versions adds maintenance burden and the v1 code has pre-existing test failures due to dependency issues.

## Background

### Current State
- **v2 Implementation**: Complete and functional
  - DocumentParserV2: ✅ Working
  - TraceabilityGraphV2: ✅ Working
  - MatrixGeneratorV2: ✅ Working
  - Neo4jExporterV2: ✅ Just completed
  - Configuration System: ✅ Working
  - Preset System: ✅ Working
  - CLI Integration: ✅ Working

- **v1 Implementation**: Has issues
  - Test suite fails due to asciidoctor dependency problems
  - CLI falls back to v1 when no v2 flags are present
  - antora-extension.ts still uses v1

- **CLI Behavior**:
  - Uses v2 when `--v2`, `--config`, or `--preset` flags are present
  - Falls back to v1 otherwise

### Problems with Current Approach
1. **Maintenance burden**: Two parallel implementations to maintain
2. **Test failures**: v1 tests fail and block CI
3. **Confusing**: Users may accidentally use v1 without realizing it
4. **Incomplete Antora integration**: antora-extension.ts uses v1, so Antora users can't use v2 features

## Proposed Solution

### Remove v1 Implementation Entirely

Make v2 the default and only version. This involves:

1. **Remove v1 source files** (8 files):
   - `src/AsciidoctorExtension.ts`
   - `src/DocumentParser.ts`
   - `src/RequirementParser.ts`
   - `src/MatrixGenerator.ts`
   - `src/Neo4jExporter.ts`
   - `src/TraceabilityGraph.ts`
   - `src/index.ts`
   - `src/types.ts`

2. **Migrate antora-extension.ts to v2**:
   - Change import from `./index.js` to `./index-v2.js`
   - Update to use `RequirementsTraceabilityExtensionV2`
   - Update parser usage: `extension.process(content)` instead of `extension.parser.parse()`
   - Update graph access: use `extension.graph.addItem()` instead of type-specific methods
   - Update matrix generation: use v2 matrix generation API

3. **Update CLI to be v2-only**:
   - Remove `RequirementsTraceabilityExtension` import
   - Remove v1 fallback in `createExtension()`
   - Simplify: always use `RequirementsTraceabilityExtensionV2`

4. **Rename v2 files to remove "V2" suffix** (optional but recommended):
   - `src/index-v2.ts` → `src/index.ts`
   - `src/types-v2.ts` → `src/types.ts`
   - `src/Neo4jExporterV2.ts` → `src/Neo4jExporter.ts`
   - Update all imports accordingly

5. **Remove failing v1 tests**:
   - Remove test files that test v1-specific functionality
   - Keep only v2-compatible tests

6. **Update package.json exports**:
   - Ensure main export points to v2 code

## Estimated Effort

| Task | Complexity | Estimated Time |
|------|------------|---------------|
| Remove v1 source files | Low | 15 minutes |
| Migrate antora-extension.ts | Medium | 1-2 hours |
| Update CLI | Low | 30 minutes |
| Rename v2 files | Low | 30 minutes |
| Remove v1 tests | Low | 15 minutes |
| Update package.json | Low | 15 minutes |
| **Total** | | **2-4 hours** |

## Impact Assessment

### Breaking Changes
⚠️ **YES - This is a breaking change**

- CLI: Currently defaults to v1 without flags, will default to v2
- Antora Extension: Will use v2 instead of v1
- API: Public API changes from v1 to v2

### Mitigation
- Version is currently `0.1.0` (pre-1.0) - breaking changes are acceptable
- Document migration in RELEASE-NOTES.md
- Update README with v2 syntax

### Benefits
✅ **Simpler codebase**: ~27KB of v1 code removed
✅ **No test failures**: Remove problematic v1 tests
✅ **Clearer user experience**: Only one version to understand
✅ **Better Antora integration**: Antora users get v2 features
✅ **Reduced maintenance**: Single implementation to maintain

### Risks
⚠️ **Migration required**: Existing users need to update to v2 syntax
⚠️ **CLI behavior change**: Default changes from v1 to v2

Note: v2 syntax is simpler (`[item, role=requirement]` vs `[req]`), so migration should be straightforward.

## Migration Path for Users

### Syntax Changes

**v1 (old)**:
```asciidoc
[req, id=REQ-001]
====
Requirement text
====

[imp, id=IMP-001]
====
Implementation
====
```

**v2 (new)**:
```asciidoc
[item, id=REQ-001, role=requirement]
====
Requirement text
====

[item, id=IMP-001, role=implementation]
====
Implementation
====
```

### Configuration Changes
- v1: Uses hardcoded requirements/implementations/tests
- v2: Uses configurable roles from presets or config files

### CLI Changes
- v1: Default behavior
- v2: Default behavior (no flags needed after migration)

## Files Affected

### To Be Deleted (11 files)
- `src/AsciidoctorExtension.ts`
- `src/DocumentParser.ts`
- `src/RequirementParser.ts`
- `src/MatrixGenerator.ts`
- `src/Neo4jExporter.ts`
- `src/TraceabilityGraph.ts`
- `src/index.ts`
- `src/types.ts`
- `test/*.test.ts` (v1 tests - approximately 12 files)

### To Be Modified (3 files)
- `src/antora-extension.ts` - Major refactor to use v2
- `src/cli.ts` - Remove v1 fallback
- `package.json` - Update main exports if needed

### To Be Renamed (3 files - optional)
- `src/index-v2.ts` → `src/index.ts`
- `src/types-v2.ts` → `src/types.ts`
- `src/Neo4jExporterV2.ts` → `src/Neo4jExporter.ts`

### To Keep Unchanged (8 files/dirs)
- `src/DocumentParserV2.ts`
- `src/MatrixGeneratorV2.ts`
- `src/Neo4jExporterV2.ts` (or renamed)
- `src/TraceabilityGraphV2.ts`
- `src/config/`
- `src/TemplateRenderer.ts`
- `src/cli.ts` (modified)
- `src/antora-extension.ts` (modified)

## Recommendation

**APPROVE** this change with the following conditions:

1. **Do it now** while the version is still 0.1.0 (pre-1.0)
2. **Skip the renaming** for now to minimize churn - keep V2 suffix
3. **Update documentation** as part of this change
4. **Create migration guide** in docs
5. **Update version to 1.0.0** after this change (separate PR)

## Next Steps

If approved:
1. Create implementation task list
2. Execute migration in a dedicated branch
3. Update tasks.md to mark all v2 tasks as complete
4. Update documentation
5. Run full test suite
6. Merge to main
