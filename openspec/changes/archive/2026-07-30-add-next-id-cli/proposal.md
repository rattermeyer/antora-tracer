## Why

When authoring traceability items, writers need to know the next available ID for a given prefix (e.g., `REQ-055` when the highest existing is `REQ-054`). Currently this requires manually scanning documents or running `stats` and parsing output. A dedicated CLI command eliminates guesswork and prevents ID collisions.

## What Changes

- Add `next-id` CLI subcommand that scans processed items and returns the next available sequential ID for a given prefix
- Accept `--prefix` (required) and `-i/--input` (file/directory to scan)
- Output: the next ID as a plain string, suitable for copy-paste into an AsciiDoc file

## Capabilities

### New Capabilities

- `next-id`: Given an ID prefix and input files, return the next available sequential ID. Matches existing IDs by prefix, finds the highest numeric suffix, and increments by one with zero-padding to three digits.

### Modified Capabilities

_None._

## Impact

- **CLI**: New `next-id` command in `cli.ts`
- **Extension**: Minor addition to `RequirementsTraceabilityExtension` to expose the `getNextId(prefix)` query on the graph
- **No changes** to parsing, validation, matrices, or extension behavior
