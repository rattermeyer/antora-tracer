## Why

Current test coverage is at 35.19% with two critical files (antora-extension.js and cli.js) showing 0% coverage because no tests exist for them. After completing the V2 migration and removing V2 suffixes, we need to add comprehensive tests to ensure reliability and catch regressions. Coverage analysis reveals clear gaps that can be systematically addressed.

## What Changes

- Add test file for `antora-extension.js` covering Antora integration points
- Add test file for `cli.js` covering all CLI commands
- Add additional tests for `TraceabilityGraph.js` to improve from 51.88% to 80%+
- Add tests for `index.js` main API methods to improve from 64.93% to 80%+
- Update c8 configuration to exclude test files from coverage reports

## Capabilities

### New Capabilities
- `testing-cli`: Test coverage for CLI commands (process, matrix, validate, export, stats, preset)
- `testing-antora-extension`: Test coverage for Antora extension integration
- `testing-graph-queries`: Test coverage for graph query and validation methods
- `testing-api-methods`: Test coverage for main extension API methods

### Modified Capabilities
- None (no existing specs to modify)

## Impact

- Test files: 2 new test files added (cli.test.ts, antora-extension.test.ts)
- Coverage improvement: Expected 35% → 70-80% overall
- Files affected: cli.js, antora-extension.js, TraceabilityGraph.js, index.js
- No breaking changes to public API
