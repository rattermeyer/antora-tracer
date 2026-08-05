## Why

The `cache-file-processing-state` change introduced a regression: macro expansion no longer works. `traceability:links[]`, `traceability:outgoing[]`, `traceability:incoming[]`, `traceability:graph[]`, and inline relationship macros like `addresses:REQ-001[]` appear as raw text in rendered HTML output instead of being expanded.

The root cause: `prepareFile()` creates a content snapshot (`prepared.content`) that is never updated. Each expand method modifies the same stale snapshot and writes back to `prepared.file`, overwriting previous methods' work. Only the last method's changes survive. The old code worked because each method read `file.contents.toString("utf8")` at entry — getting the latest content that previous methods had already modified.

## What Changes

- **Revert content reading to live file source**: Each expand method reads content from `prepared.file.contents` (the latest, accumulated state) instead of `prepared.content` (the stale snapshot)
- **Recompute item blocks per method**: Each method calls `findItemBlocks()` on the current content to get position-accurate block locations
- **Keep `docAttrs` cached**: Document attributes are immutable during processing — saving 4× `parseDocAttributes` calls per file
- **Keep `PreparedFile` type**: Source metadata (`sourceFile`, `component`, `module`) and `file` reference remain cached
- **Drop `content` and `blocks` from PreparedFile**: These are no longer safe to cache across mutations

## Capabilities

### Modified Capabilities

- `file-preparation-cache`: The cache is scoped to document attributes and source metadata only. Content and item blocks are recomputed per expansion pass to ensure position accuracy and content freshness.

## Impact

- `src/antora-extension.ts` — `PreparedFile` simplified; each expand method reads live content and recomputes blocks; no change to the contentClassified handler structure
- Tests: the existing 275 tests pass (the macro expansion tests exercise the full pipeline and will catch this regression)
- Requires `npm run build` and `npx antora antora-playbook.yml` verification
