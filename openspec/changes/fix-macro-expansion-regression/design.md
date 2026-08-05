## Context

The `cache-file-processing-state` change introduced `prepareFile()` which creates a `PreparedFile` snapshot containing `content`, `docAttrs`, `blocks`, and source metadata. Five macro-expansion methods receive this snapshot and use its fields instead of independently reading from the raw file object.

The bug: each method applies replacements to `prepared.content` (the original snapshot) and writes to `prepared.file`. Since `prepared.content` is never updated, each subsequent method overwrites the previous method's changes. Only the last method's output survives.

The old code (pre-caching) worked because each method called `file.contents.toString("utf8")` at entry — reading the latest accumulated content, then called `findItemBlocks(content)` for position-accurate block locations.

## Goals / Non-Goals

**Goals:**
- Restore correct macro expansion so all five passes' changes accumulate in the final output
- Preserve the `docAttrs` caching optimization (the most expensive per-file operation)
- Preserve the `PreparedFile` abstraction and single-loop handler structure
- Zero change to rendered output other than the regression fix

**Non-Goals:**
- Caching `content` or `blocks` across passes (proven unsafe)
- Changing the approach to collect-then-apply (keeps the simpler sequential approach)
- Adding new tests (existing macro expansion tests cover this)

## Decisions

### Decision 1: Read live content, recompute blocks, cache docAttrs

Each expand method reads content from `prepared.file.contents` and calls `findItemBlocks()` on it:

```typescript
private expandRelationMacros(prepared: PreparedFile, macroName: RelationMacro): void {
    const buf = prepared.file.contents || prepared.file.src?.contents;
    if (!buf) return;
    const content = buf.toString("utf8");
    if (!content.includes(`traceability:${macroName}[]`)) return;

    const blocks = this.findItemBlocks(content);
    // ... rest unchanged, using content, blocks, prepared.docAttrs, prepared.sourceFile, etc.
}
```

**Rationale:** `buf→string` on a recently-created Buffer is cheap (V8 caches the internal string). `findItemBlocks` is necessary for position accuracy — offsets shift when previous methods modify content. `parseDocAttributes` is the expensive operation (splits entire content, regex-matches every line) and is safe to cache because document attributes are header-level and immutable during processing.

**Alternative considered (collect-then-apply):** Each method returns replacements, all applied at once. Cleaner but requires more structural changes — method return types change, replacements accumulate in the handler loop. The sequential approach is simpler and matches the pre-caching code flow.

### Decision 2: Slim down PreparedFile

Remove `content` and `blocks` from the `PreparedFile` interface since they're no longer cached:

```typescript
interface PreparedFile {
  file: any;
  docAttrs: Record<string, string>;
  sourceFile: string;
  component?: string;
  module?: string;
}
```

`prepareFile()` computes `docAttrs` and source metadata only. Content and blocks are read fresh in each expand method.

### Decision 3: Keep `prepareFile()` in the handler loop

The structure remains:
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

No structural changes to the handler — only the internal implementation of `prepareFile()` and each expand method changes.

## Risks / Trade-offs

- **[Risk] `findItemBlocks` is called 5× per file instead of 1×**: The old (buggy) cache saved 4× calls. → **Acceptable**: This is exactly what the pre-caching code did (5× was the baseline). The 4× `parseDocAttributes` savings remain — that's the expensive operation.
- **[Risk] `buf→string` is called 5× per file**: Same as above — pre-caching baseline. V8 caches Buffer→string conversions, making this negligible.
