# Design: Open Block Items

## Context

The `extractBlock` method in `DocumentParser` currently only recognizes `====` as a block delimiter. Items with `--` (open block) are not parsed. One item (ARC-001) already uses `--` and works correctly.

## Decision: Accept Both Delimiters

**Change**: Modify `extractBlock` in `DocumentParser.ts` to find the opening delimiter (either `====` or `--`) and use the same delimiter as the closing marker.

```typescript
private extractBlock(content: string, startIndex: number): string | null {
    // Find the opening delimiter: ==== or --
    let blockStart = content.indexOf('====', startIndex);
    let delimiter = '====';
    if (blockStart === -1) {
        blockStart = content.indexOf('--', startIndex);
        delimiter = '--';
    }
    if (blockStart === -1) return null;
    const blockEnd = content.indexOf(delimiter, blockStart + delimiter.length);
    if (blockEnd === -1) return null;
    return content.substring(startIndex, blockEnd + delimiter.length);
}
```

**Rationale**: Backward compatible — existing `====` items continue to work. Open blocks render cleaner without auto-numbering.

**Trade-off**: Open blocks have less visual distinction than example blocks (no border). Acceptable for documentation-focused output.
