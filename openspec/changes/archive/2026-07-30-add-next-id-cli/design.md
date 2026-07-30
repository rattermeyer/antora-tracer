## Context

The `TraceabilityGraph` already stores all items by ID. The CLI already has `process`, `matrix`, `validate`, `export`, `stats`, and `preset` subcommands. Adding `next-id` follows the same pattern: process input files, query the graph, output a result.

## Goals / Non-Goals

**Goals:**
- Return the next available sequential ID for a given prefix
- Work with both single files and directories
- Output a plain string (no JSON wrapping, no color) for easy copy-paste

**Non-Goals:**
- Reserve or allocate IDs (stateless — doesn't modify files)
- Handle non-numeric suffixes (e.g., `REQ-001a`)
- Validate that the returned ID is actually unused (gap-aware but not gap-filling)

## Decisions

### 1. Gap-ignorant: use max+1, not first gap

**Decision**: Return `prefix-<max+1>` even if there are gaps in the sequence (e.g., `REQ-001, REQ-005` → returns `REQ-006`, not `REQ-002`).

**Rationale**: Simpler mental model. Gaps indicate deleted or renumbered items. Filling gaps risks reusing IDs that readers might still reference. Max+1 is the convention in this project's current usage.

### 2. Plain string output

**Decision**: Output the ID as a plain string, no JSON, no formatting, no chalk.

**Rationale**: The primary use case is copy-paste into an AsciiDoc file. Wrapping in JSON or adding color adds friction. The output is a single token meant to be consumed by a human, not a script.

### 3. Auto-detect padding from existing IDs

**Decision**: Determine the numeric suffix width by scanning existing IDs for the given prefix. If all existing IDs use a consistent width (e.g., 3 digits), match it. If no IDs exist, default to 3 digits.

**Rationale**: Follows the project's established convention without requiring the user to specify padding. The first item establishes the convention — if the user creates `REQ-0001`, subsequent IDs are 4-digit. If `REQ-001`, 3-digit. This is documented in the user guide so users know to set the convention with their first item.

## Risks / Trade-offs

- **Prefix collision**: If the user passes a prefix that matches no existing IDs, returns `prefix-001` — which may collide with IDs from other prefixes. → Acceptable; the user knows their naming conventions.
