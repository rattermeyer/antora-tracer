# v2 Migration Tasks

## Overview
Migrate from dual v1/v2 implementation to v2-only. Remove v1 code and make v2 the default.

**Effort**: 2-4 hours
**Priority**: High
**Status**: ✅ Complete — all implementation work done through unified-item-architecture and direct development. Remaining release-prep tasks (RELEASE-NOTES, CHANGELOG, version bump) tracked under unified-item-architecture §11.

---

## Phase 1: Preparation (15 min)

- [x] Create feature branch for v2 migration — work done on main branch
- [x] Backup current state — git history preserves everything
- [x] Notify team of upcoming breaking change — no team; version is pre-1.0

## Phase 2: Remove v1 Implementation (30 min)

### Source Files to Delete
- [x] Remove `src/AsciidoctorExtension.ts` — deleted
- [x] Remove `src/DocumentParser.ts` — rewritten as unified version
- [x] Remove `src/RequirementParser.ts` — deleted
- [x] Remove `src/MatrixGenerator.ts` — rewritten as unified version
- [x] Remove `src/Neo4jExporter.ts` — rewritten as unified version
- [x] Remove `src/TraceabilityGraph.ts` — rewritten as unified version
- [x] Remove `src/index.ts` — rewritten as unified version
- [x] Remove `src/types.ts` — rewritten as unified version

### Test Files to Delete
- [x] Remove `test/antora-extension.test.ts` — replaced with new version
- [x] Remove `test/basic.test.ts` — deleted
- [x] Remove `test/bidirectional.test.ts` — deleted
- [x] Remove `test/document-parser.test.ts` — deleted
- [x] Remove `test/graph.test.ts` — deleted
- [x] Remove `test/integration.test.ts` — deleted
- [x] Remove `test/matrix-generator.test.ts` — deleted
- [x] Remove `test/performance.test.ts` — deleted
- [x] Remove `test/processor.test.ts` — deleted
- [x] Remove `test/simple-block.test.ts` — deleted
- [x] Remove `test/traceability.test.ts` — deleted
- [x] Remove `test/validation.test.ts` — deleted

## Phase 3: Migrate antora-extension.ts to v2 (1-2 hours)

### Import Changes
- [x] Change import from `./index.js` to `./index-v2.js` — imports `RequirementsTraceabilityExtension` from unified index
- [x] Update type imports to use v2 types — uses unified types

### Class Changes
- [x] Change `RequirementsTraceabilityExtension` to `RequirementsTraceabilityExtensionV2` — V2 suffix dropped; uses unified name
- [x] Update constructor to use v2 extension — uses unified extension

### Parser Usage Changes
- [x] Replace `extension.parser.parse(content)` with `extension.process(content)` — done
- [x] Update to use ParserResult from v2 — done

### Graph Access Changes
- [x] Replace all type-specific graph additions with single `process()` call — done
- [x] Update to use `result.items` instead of `parsed.requirements`, etc. — done

### Relationship Processing Changes
- [x] Remove separate relationship processing pass — relationships auto-added by process()
- [x] Verify relationships are handled by v2 parser — handled by unified parser

### Matrix Generation Changes
- [x] Import `MatrixGeneratorV2` from `./MatrixGeneratorV2.js` — unified `MatrixGenerator` used
- [x] Create generator instance with `extension.graph` — done
- [x] Update matrix generation to use v2 API — done
- [x] Update matrix type names to match v2 configuration — config-driven matrix names

### Coverage Report Changes
- [x] Update coverage report generation to use v2 API — done
- [x] Update coverage HTML template if needed — uses TemplateRenderer + Mustache

### Item Count Logging
- [x] Update all item count logging to use role-based queries — done (`getItemsByRole()`)

## Phase 4: Update CLI to be v2-only (30 min)

- [x] Remove `import { RequirementsTraceabilityExtension } from './index.js'` — unified import only
- [x] Update `createExtension()` to always return v2 extension — no v1/v2 conditional
- [x] Remove v1 fallback logic — no `--v2` flag, no fallback
- [x] Remove all conditional v1/v2 code paths — clean single path
- [x] Simplify: always use `RequirementsTraceabilityExtensionV2` — uses unified extension

## Phase 5: Update Package Exports (15 min)

- [x] Verify `package.json` main export is correct — points to `./lib/src/index.js`
- [x] Update `exports` field if needed to point to v2 — exports unified code
- [x] Consider: Rename v2 files (optional) — done; V2 suffix removed from all files

## Phase 6: Testing (30 min)

- [x] Run `npm run build` - verify no TypeScript errors — builds clean
- [x] Test CLI with no flags (should use v2) — unified extension used
- [x] Test CLI with --preset flag — tested
- [x] Test CLI with --config flag — tested
- [x] Test CLI with --v2 flag — flag removed (no longer needed)
- [x] Test all commands: process, matrix, validate, stats, export neo4j — 181 tests passing
- [x] Test preset commands: list, show, init — tested

## Phase 7: Documentation Updates (30 min)

- [x] Update README.md with v2 syntax — rewritten as README.adoc
- [x] Document [item] macro syntax — documented in README + user guide
- [x] Document role-based configuration — documented in README + user guide
- [x] Document preset system — documented in README + user guide
- [x] Add migration guide from v1 to v2 — N/A: this is the first release, no v1 users to migrate
- [x] Update examples to use v2 syntax — all examples use [item] syntax

## Phase 8: Finalization (15 min)

- [ ] Create RELEASE-NOTES.md entry for v0.7.0 — tracked under unified-item-architecture §11
- [ ] Update CHANGELOG.md — tracked under unified-item-architecture §11
- [x] Commit all changes — committed
- [x] Push to feature branch — on main branch
- [x] Create Pull Request — N/A (direct development on main)

---

## Verification Checklist

Before archiving:
- [x] All v1 files removed — confirmed; none of the 8 source files or 12 test files exist
- [x] antora-extension.ts migrated to v2 — uses unified `RequirementsTraceabilityExtension`
- [x] CLI updated to v2-only — no `--v2` flag, no v1/v2 conditional, no fallback
- [x] Build passes without errors — `npm run build` clean
- [x] All v2 CLI commands tested — 181 tests passing
- [x] Documentation updated — README, user guide, developer guide all rewritten
- [x] Migration guide created — N/A for first release

## Summary

All implementation tasks complete. Two remaining tasks (RELEASE-NOTES for v0.7.0, CHANGELOG update) overlap with unified-item-architecture §11 and are tracked there. This change is ready to archive.
