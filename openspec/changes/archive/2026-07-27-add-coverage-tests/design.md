## Context

Current test coverage is at 35.19% overall. Coverage analysis was performed using `npm run test:coverage` with c8. The analysis revealed that:

- **antora-extension.js** and **cli.js** have 0% coverage because no test files import them
- **TraceabilityGraph.js** has 51.88% coverage with many graph operations untested
- **index.js** has 64.93% coverage with API methods partially tested
- **Neo4jExporter.js** (96.01%) and **TemplateRenderer.js** (93.1%) are well covered

The test:coverage script was updated to exclude test files from coverage reports (they were showing as 0% which is expected but misleading).

Current testing setup:
- Test runner: Mocha + Chai
- Coverage: c8
- Test files: TypeScript in `test/` directory, compiled to `lib/test/`
- Tests import from `lib/src/` (via relative paths from test files)

## Goals / Non-Goals

**Goals:**
- Add comprehensive test coverage for antora-extension.js (0% → 80%+)
- Add comprehensive test coverage for cli.js (0% → 80%+)
- Improve TraceabilityGraph.js coverage from 51.88% to 80%+
- Improve index.js coverage from 64.93% to 80%+
- Achieve overall coverage of 70-80%
- Maintain all existing passing tests (73 tests)

**Non-Goals:**
- Add tests for TemplateRenderer.js (already at 93.1%)
- Add tests for Neo4jExporter.js (already at 96.01%)
- Modify source code to make it more testable (refactoring is out of scope)
- Add property-based testing or fuzz testing
- Set up CI/CD integration for coverage

## Decisions

### Test File Structure
**Decision**: Create separate test files for each major module (cli.test.ts, antora-extension.test.ts) rather than a single monolithic test file.
**Rationale**:
- Follows existing convention (matrix-generator.test.ts, neo4j-exporter.test.ts, config-loader.test.ts)
- Easier to maintain and navigate
- Clear ownership of tests per module
- Parallel test execution possible

**Alternatives considered**:
- Single integration test file: Would be harder to maintain and debug
- Test per class: Too granular, would create too many small files

### Testing Approach for CLI
**Decision**: Test CLI commands by invoking the programmatic API rather than spawning child processes.
**Rationale**:
- Faster test execution (no process spawning overhead)
- Easier to mock and assert
- More reliable (no dependency on shell environment)
- Can test command logic without I/O side effects

**Alternatives considered**:
- Spawn child processes: More realistic but slower and harder to test
- Use a CLI testing library: Adds dependency, overkill for this use case

### Testing Approach for Antora Extension
**Decision**: Test the AntoraTraceabilityExtension class directly by creating instances and calling methods, rather than testing through the full Antora pipeline.
**Rationale**:
- Antora integration testing requires a full Antora environment which is complex
- Unit testing the class directly gives us good coverage
- We can mock the Antora context
- Can still test the register() function which is the entry point

**Alternatives considered**:
- Full Antora integration tests: Requires setting up Antora, too heavy
- Only test public API: Would miss internal logic

### Test Coverage Targets
**Decision**: Target 80%+ statement coverage for each new test file.
**Rationale**:
- 80% is a good balance between thoroughness and pragmatism
- Catches most bugs while not requiring 100% (which can be counterproductive)
- Aligns with industry best practices

**Alternatives considered**:
- 100% coverage: Too strict, would require testing trivial code
- 60% coverage: Too low, would miss important edge cases

## Risks / Trade-offs

**[Risk] CLI tests may not catch all environment-specific issues** → Mitigation: Test with various input scenarios and error conditions to cover edge cases. Add integration tests in the future if environment-specific issues arise.

**[Risk] Antora extension tests may not reflect real Antora behavior** → Mitigation: Test all public methods of AntoraTraceabilityExtension class. The class is designed to be testable independently. Mock the Antora context where needed.

**[Risk] Adding many tests may slow down the test suite** → Mitigation: Keep tests focused and fast. Use beforeEach for setup rather than repeating code. Avoid I/O in tests where possible.

**[Risk] Tests may become outdated as source code changes** → Mitigation: Follow TDD practices where possible. Keep tests close to the implementation. Review tests during code reviews.

## Migration Plan

No migration needed - this is purely additive (new test files). Existing tests will continue to pass.

**Steps:**
1. Create test/cli.test.ts with tests for all CLI commands
2. Create test/antora-extension.test.ts with tests for Antora extension
3. Add additional tests to test/v2-unified-item-architecture.test.ts for TraceabilityGraph methods
4. Run coverage and verify improvement
5. Commit changes

**Rollback strategy**: Simply delete the new test files if needed. No changes to source code.

## Open Questions

- Should we add a coverage threshold to CI to prevent regressions? (Recommended: yes, but out of scope for this change)
- Should we use a different test framework for CLI testing? (Current Mocha + Chai is sufficient)
- Should we add snapshot testing for generated output? (Not needed for initial implementation)
