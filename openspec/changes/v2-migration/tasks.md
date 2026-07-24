# v2 Migration Tasks

## Overview
Migrate from dual v1/v2 implementation to v2-only. Remove v1 code and make v2 the default.

**Effort**: 2-4 hours
**Priority**: High
**Status**: Proposed

---

## Phase 1: Preparation (15 min)

- [ ] Create feature branch for v2 migration
- [ ] Backup current state
- [ ] Notify team of upcoming breaking change

## Phase 2: Remove v1 Implementation (30 min)

### Source Files to Delete
- [ ] Remove `src/AsciidoctorExtension.ts`
- [ ] Remove `src/DocumentParser.ts`
- [ ] Remove `src/RequirementParser.ts`
- [ ] Remove `src/MatrixGenerator.ts`
- [ ] Remove `src/Neo4jExporter.ts`
- [ ] Remove `src/TraceabilityGraph.ts`
- [ ] Remove `src/index.ts`
- [ ] Remove `src/types.ts`

### Test Files to Delete
- [ ] Remove `test/antora-extension.test.ts`
- [ ] Remove `test/basic.test.ts`
- [ ] Remove `test/bidirectional.test.ts`
- [ ] Remove `test/document-parser.test.ts`
- [ ] Remove `test/graph.test.ts`
- [ ] Remove `test/integration.test.ts`
- [ ] Remove `test/matrix-generator.test.ts`
- [ ] Remove `test/performance.test.ts`
- [ ] Remove `test/processor.test.ts`
- [ ] Remove `test/simple-block.test.ts`
- [ ] Remove `test/traceability.test.ts`
- [ ] Remove `test/validation.test.ts`

## Phase 3: Migrate antora-extension.ts to v2 (1-2 hours)

### Import Changes
- [ ] Change import from `./index.js` to `./index-v2.js`
- [ ] Update type imports to use v2 types

### Class Changes
- [ ] Change `RequirementsTraceabilityExtension` to `RequirementsTraceabilityExtensionV2`
- [ ] Update constructor to use v2 extension

### Parser Usage Changes
- [ ] Replace `extension.parser.parse(content)` with `extension.process(content)`
- [ ] Update to use ParserResult from v2

### Graph Access Changes
**Old v1 API:**
```typescript
for (const req of parsed.requirements) {
  this.traceability.graph.addRequirement(req);
}
for (const imp of parsed.implementations) {
  this.traceability.graph.addImplementation(imp);
}
// ... etc for test, document, design
```

**New v2 API:**
```typescript
const result = extension.process(content, { sourceFile });
// Items are automatically added to graph
// No need for separate add* calls
```

- [ ] Replace all type-specific graph additions with single `process()` call
- [ ] Update to use `result.items` instead of `parsed.requirements`, etc.

### Relationship Processing Changes
**Old v1:**
```typescript
for (const rel of parsed.relationships) {
  this.traceability.graph.addRelationship(rel);
}
```

**New v2:**
```typescript
// Relationships are automatically added by process()
// No separate call needed
```

- [ ] Remove separate relationship processing pass
- [ ] Verify relationships are handled by v2 parser

### Matrix Generation Changes
**Old v1:**
```typescript
this.traceability.exportMatrixToHTML(matrixType)
this.traceability.exportMatrixToCSV(matrixType)
```

**New v2:**
```typescript
const generator = new MatrixGeneratorV2(extension.graph);
generator.generateMatrix(matrixName)
generator.exportToHTML(matrix)
generator.exportToCSV(matrix)
```

- [ ] Import `MatrixGeneratorV2` from `./MatrixGeneratorV2.js`
- [ ] Create generator instance with `extension.graph`
- [ ] Update matrix generation to use v2 API
- [ ] Update matrix type names to match v2 configuration

### Coverage Report Changes
**Old v1:**
```typescript
const coverage = this.traceability.getCoverageReport();
```

**New v2:**
```typescript
const coverage = extension.graph.getRoleStatistics();
// Or use MatrixGeneratorV2.getCoverageReport()
```

- [ ] Update coverage report generation to use v2 API
- [ ] Update coverage HTML template if needed

### Item Count Logging
**Old v1:**
```typescript
this.traceability.graph.getAllRequirements().length
this.traceability.graph.getAllImplementations().length
```

**New v2:**
```typescript
extension.graph.getItemsByRole('requirement').length
extension.graph.getItemsByRole('implementation').length
```

- [ ] Update all item count logging to use role-based queries

## Phase 4: Update CLI to be v2-only (30 min)

- [ ] Remove `import { RequirementsTraceabilityExtension } from './index.js'`
- [ ] Update `createExtension()` to always return v2 extension
- [ ] Remove v1 fallback logic
- [ ] Remove all conditional v1/v2 code paths
- [ ] Simplify: always use `RequirementsTraceabilityExtensionV2`

**Current code:**
```typescript
async function createExtension(options: any) {
  const globalOpts = program.opts();
  const mergedOptions = { ...options, ...globalOpts };

  if (mergedOptions.v2 || mergedOptions.config || mergedOptions.preset) {
    try {
      if (mergedOptions.preset) {
        return await RequirementsTraceabilityExtensionV2.createWithPreset(mergedOptions.preset);
      } else if (mergedOptions.config) {
        const configLoader = new ConfigLoader();
        configLoader.load(mergedOptions.config);
        return new RequirementsTraceabilityExtensionV2(configLoader);
      } else {
        return new RequirementsTraceabilityExtensionV2();
      }
    } catch (error: any) {
      console.error(chalk.red('Error creating v2 extension:', error.message));
      console.error(chalk.yellow('Falling back to v1...'));
      return new RequirementsTraceabilityExtension();
    }
  }
  return new RequirementsTraceabilityExtension();
}
```

**New code:**
```typescript
async function createExtension(options: any) {
  const globalOpts = program.opts();
  const mergedOptions = { ...options, ...globalOpts };

  try {
    if (mergedOptions.preset) {
      return await RequirementsTraceabilityExtensionV2.createWithPreset(mergedOptions.preset);
    } else if (mergedOptions.config) {
      const configLoader = new ConfigLoader();
      configLoader.load(mergedOptions.config);
      return new RequirementsTraceabilityExtensionV2(configLoader);
    } else {
      return new RequirementsTraceabilityExtensionV2();
    }
  } catch (error: any) {
    console.error(chalk.red('Error creating extension:', error.message));
    process.exit(1);
  }
}
```

## Phase 5: Update Package Exports (15 min)

- [ ] Verify `package.json` main export is correct
- [ ] Update `exports` field if needed to point to v2
- [ ] Consider: Rename v2 files (optional)

## Phase 6: Testing (30 min)

- [ ] Run `npm run build` - verify no TypeScript errors
- [ ] Test CLI with no flags (should use v2)
- [ ] Test CLI with --preset flag
- [ ] Test CLI with --config flag
- [ ] Test CLI with --v2 flag
- [ ] Test all commands: process, matrix, validate, stats, export neo4j
- [ ] Test preset commands: list, show, init

## Phase 7: Documentation Updates (30 min)

- [ ] Update README.md with v2 syntax
- [ ] Document [item] macro syntax
- [ ] Document role-based configuration
- [ ] Document preset system
- [ ] Add migration guide from v1 to v2
- [ ] Update examples to use v2 syntax

## Phase 8: Finalization (15 min)

- [ ] Create RELEASE-NOTES.md entry for breaking changes
- [ ] Update CHANGELOG.md
- [ ] Commit all changes
- [ ] Push to feature branch
- [ ] Create Pull Request

---

## Verification Checklist

Before merging:
- [ ] All v1 files removed
- [ ] antora-extension.ts migrated to v2
- [ ] CLI updated to v2-only
- [ ] Build passes without errors
- [ ] All v2 CLI commands tested
- [ ] Documentation updated
- [ ] Migration guide created

## Rollback Plan

If issues are discovered:
1. Revert to main branch
2. v1 code is in git history and can be restored if needed
3. Create new branch for fixes

## Notes

- The v2 syntax is **simpler** than v1, so user migration should be straightforward
- Current version is `0.1.0` (pre-1.0), so breaking changes are acceptable
- All v2 features are complete and tested
