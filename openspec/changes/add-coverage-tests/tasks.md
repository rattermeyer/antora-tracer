## 1. Configuration Fix

- [x] 1.1 Update test:coverage script in package.json to exclude test files from coverage reports

## 2. CLI Tests (Priority: High - Now at ~100% via programmatic API)

- [x] 2.1 Create test/cli.test.ts with Mocha/Chai setup
- [x] 2.2 Test CLI process command with valid input file
- [x] 2.3 Test CLI process command with missing input
- [x] 2.4 Test CLI process command with invalid file path
- [x] 2.5 Test CLI matrix command with valid input
- [x] 2.6 Test CLI matrix command with different output formats (csv, html, json)
- [x] 2.7 Test CLI matrix command without input
- [x] 2.8 Test CLI validate command with valid input
- [x] 2.9 Test CLI validate command with invalid input
- [x] 2.10 Test CLI export neo4j command with CSV format
- [x] 2.11 Test CLI export neo4j command with Cypher format
- [x] 2.12 Test CLI export neo4j command without input
- [x] 2.13 Test CLI stats command with valid input
- [x] 2.14 Test CLI stats command without input
- [x] 2.15 Test CLI preset list command
- [x] 2.16 Test CLI preset show command with valid preset
- [x] 2.17 Test CLI preset show command with invalid preset
- [x] 2.18 Test CLI preset init command
- [x] 2.19 Test CLI help command
- [x] 2.20 Verify all CLI tests pass

## 3. Antora Extension Tests (Priority: High - Now covered)

- [x] 3.1 Create test/antora-extension.test.ts with Mocha/Chai setup
- [x] 3.2 Test AntoraTraceabilityExtension initialization with default config
- [x] 3.3 Test AntoraTraceabilityExtension initialization with config path
- [x] 3.4 Test AntoraTraceabilityExtension initialization with preset
- [x] 3.5 Test AntoraTraceabilityExtension initialization with disabled extension
- [x] 3.6 Test processAsciiDocFile with valid AsciiDoc content
- [x] 3.7 Test processAsciiDocFile with file without traceable items
- [x] 3.8 Test generateTraceabilityFiles with configured matrices
- [x] 3.9 Test generateTraceabilityFiles with default matrices
- [x] 3.10 Test generateTraceabilityFiles with no items
- [x] 3.11 Test generateCoverageReport
- [x] 3.12 Test registration of event handlers on init
- [x] 3.13 Test getTraceabilityExtension returns extension
- [x] 3.14 Test getTraceabilityExtension throws when not initialized
- [x] 3.15 Verify all Antora extension tests pass

## 4. Graph Query Tests (Priority: Medium - Currently 51.88% coverage)

- [ ] 4.1 Add tests to test/v2-unified-item-architecture.test.ts for merge() method
- [ ] 4.2 Add tests for getRelatedItems() with various graph structures
- [ ] 4.3 Add tests for getItemsWithRelationTo() with various graph structures
- [ ] 4.4 Add tests for getRelationshipsByRoles() with different role combinations
- [ ] 4.5 Add tests for findPath() with connected items
- [ ] 4.6 Add tests for findPath() with disconnected items
- [ ] 4.7 Add tests for findPath() with maxDepth parameter
- [ ] 4.8 Add tests for getImpactAnalysis()
- [ ] 4.9 Verify Graph tests pass

## 5. API Methods Tests (Priority: Medium - Currently 64.93% coverage)

- [ ] 5.1 Add tests to test/v2-unified-item-architecture.test.ts for processFiles() method
- [ ] 5.2 Add tests for getAllItems() method
- [ ] 5.3 Add tests for getAllRelationships() method
- [ ] 5.4 Add tests for getItemsByRole() method
- [ ] 5.5 Add tests for getRelationships() method with and without type filter
- [ ] 5.6 Add tests for getRelatedItems() method
- [ ] 5.7 Add tests for getRoleStatistics() method
- [ ] 5.8 Add tests for validate() method
- [ ] 5.9 Add tests for getConfigErrors() method
- [ ] 5.10 Add tests for createNeo4jExporter() method
- [ ] 5.11 Add tests for exportToNeo4jCSV() method
- [ ] 5.12 Add tests for getCoverageReport() method
- [ ] 5.13 Add tests for getMatrixDefinitions() method
- [ ] 5.14 Add tests for isKnownRole() method
- [ ] 5.15 Add tests for isRelationAllowed() method
- [ ] 5.16 Add tests for getAllowedRelations() method
- [ ] 5.17 Add tests for listPresets() method
- [ ] 5.18 Add tests for getPreset() method
- [ ] 5.19 Add tests for clear() method
- [ ] 5.20 Add tests for resetWithConfig() method
- [ ] 5.21 Verify all API tests pass

## 6. Verification

- [ ] 6.1 Run full test suite (all existing + new tests)
- [ ] 6.2 Run coverage report and verify improvement
- [ ] 6.3 Verify overall coverage >= 70%
- [ ] 6.4 Verify antora-extension.js coverage >= 80%
- [ ] 6.5 Verify cli.js coverage >= 80%
- [ ] 6.6 Verify TraceabilityGraph.js coverage >= 80%
- [ ] 6.7 Verify index.js coverage >= 80%
- [ ] 6.8 Commit all changes
