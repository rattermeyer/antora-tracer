## Context

The `AntoraTraceabilityExtension.contentClassified` handler iterates over page files and calls five macro-expansion methods. Each method currently receives the raw Antora `file` object and independently:

1. Extracts and converts the content buffer to a UTF-8 string
2. Calls `parseDocAttributes()` which splits the entire content by `\n` and regex-matches each line for document attributes
3. Calls `findItemBlocks()` which runs a global regex scan over the entire content looking for `[#ID, item,...]` patterns, then does character-by-character quote-aware scanning to find closing brackets and `--` delimiters

These three steps are identical across all five methods. The only differences are which macro each method looks for and what output it generates. For 9 page files, steps 1–3 execute 45 times instead of 9.

The optimization is purely internal — no observable behavior changes.

## Goals / Non-Goals

**Goals:**
- Eliminate redundant buffer→string conversion (5→1 per file)
- Eliminate redundant doc-attribute parsing (5→1 per file)
- Eliminate redundant item-block scanning (5→1 per file)
- Keep all five macro-expansion methods functionally identical
- Zero change to rendered output or public API

**Non-Goals:**
- Changing how any macro type renders
- Changing the `findItemBlocks` algorithm itself
- Caching across files or across Antora events (single-file, single-event scope)
- Extracting the prepare/share pattern beyond `antora-extension.ts`

## Decisions

### Decision 1: PreparedFile as a plain data object, not a class

A simple interface with a factory function:

```typescript
interface PreparedFile {
  file: any;            // raw Antora file ref (for write-back)
  content: string;      // UTF-8 string
  docAttrs: Record<string, string>;
  blocks: ItemBlock[];  // { itemId, headerStart, headerEnd, bodyStart, bodyEnd }[]
  sourceFile: string;
  component?: string;
  module?: string;
}
```

**Rationale:** No methods, no inheritance, no complexity. The factory function `prepareFile(rawFile)` does all three expensive operations and returns an immutable-feeling snapshot. Method signatures change from `(file: any, ...)` to `(prepared: PreparedFile, ...)`.

**Alternative considered:** A class with getters/lazy evaluation. Rejected — we want the work done once eagerly, not deferred. Lazy evaluation could reintroduce redundant work if access patterns change.

### Decision 2: Keep `blocks` lightweight — only positions, not body content

`findItemBlocks` already returns just `{ itemId, headerStart, headerEnd, bodyStart, bodyEnd }`. Each expand method slices `content` using these positions. We keep this pattern — `PreparedFile.blocks` is the position array, and methods still slice `content` as needed. This avoids storing potentially large body strings for every item block.

**Alternative considered:** Pre-extracting body strings for each block. Would add memory overhead (potentially duplicating most of the file content in substrings). The position-based approach uses negligible memory (each block entry is ~6 integers + 1 string).

### Decision 3: Prepare inside the file loop, scoped to one file

```typescript
for (const file of pageFilesForVersion) {
  const prepared = this.prepareFile(file);
  this.expandRelationMacros(prepared, "outgoing");
  this.expandRelationMacros(prepared, "incoming");
  this.expandRelationMacros(prepared, "links");
  this.expandGraphMacros(prepared);
  this.expandCoverageMacros(prepared);
}
```

The `PreparedFile` lives only for the duration of one file's processing — no cross-file caching, no memory retention issues. Garbage collection cleans up after each iteration.

**Alternative considered:** Preparing all files first into an array, then iterating. No benefit — same number of operations, higher peak memory.

### Decision 4: Write-back through `prepared.file`

When an expand method modifies content, it writes back to `prepared.file.contents` and `prepared.file.src.contents`. The `content` field in `PreparedFile` is the original snapshot; modified content is written to the Antora file object directly. This matches the existing mutation pattern exactly.

## Risks / Trade-offs

- **[Risk] Stale `content` after modification**: If one expand method modifies content and writes to `prepared.file`, subsequent methods read from `prepared.content` (the snapshot). → **Mitigation**: The existing code already has this behavior — each method independently calls `buf→string` at entry, so they're all working from separate snapshots. No regression. The expando methods don't depend on each other's output (they expand different macro types).
- **[Risk] `findItemBlocks` positions become invalid after content modification**: If one method replaces text and shifts offsets, a later method's block positions would be wrong. → **Mitigation**: Same as above — the methods are independent and don't modify overlapping regions. `expandRelationMacros` only touches `traceability:outgoing[]`/`incoming[]`/`links[]` text; `expandGraphMacros` only touches `traceability:graph[...]`; they don't overlap.
