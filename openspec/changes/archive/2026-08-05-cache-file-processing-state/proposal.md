## Why

The `contentClassified` handler processes each page file through five macro-expansion methods (`expandRelationMacros` ×3, `expandGraphMacros`, `expandCoverageMacros`). Each method independently converts the file's buffer to a string, parses document attributes via full-content regex, and scans for item blocks via `findItemBlocks`. For the example site's 9 page files, this means 45 total operations where only 9 are needed — an 80% waste rate on CPU-bound parsing work that runs on every Antora build.

## What Changes

- Introduce an internal `PreparedFile` type that caches `content` (string), `docAttrs`, `blocks` (item block positions), and source metadata for a single file
- Add a `prepareFile(file)` method that does buffer→string, `parseDocAttributes`, `findItemBlocks`, and source-info normalization once per file
- Refactor `expandRelationMacros`, `expandGraphMacros`, and `expandCoverageMacros` to accept `PreparedFile` instead of raw `file`
- Update the `contentClassified` handler to prepare each file once and pass the prepared object to all five expand methods
- No change to macro rendering output, file mutation behavior, or public API

## Capabilities

### New Capabilities

- `file-preparation-cache`: File content, document attributes, and item block positions are computed once per file and reused across all macro-expansion passes during the `contentClassified` event

### Modified Capabilities

None — no user-facing behavior or output changes.

## Impact

- `src/antora-extension.ts` — new `PreparedFile` type and `prepareFile()` method; five method signatures change to accept `PreparedFile`; `contentClassified` handler restructured
- Tests: all existing tests continue to pass (no behavioral change); the macro expansion unit tests remain valid
