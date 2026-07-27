# Proposal: Use Open Blocks for Items

## Why

Items currently use `====` (example block) delimiters, which renders with "Example N." auto-numbering, borders, and background styling. This visual chrome distracts from the item content and makes the rendered output feel like code samples rather than documentation.

ARC-001 already uses `--` (open block), which renders cleanly without auto-numbering or borders. Converting all items to open blocks would unify the rendering and give cleaner, more professional output.

## What Changes

- **Modified**: `DocumentParser.extractBlock()` to accept both `====` and `--` delimiters
- **Modified**: Example site — replace `====` with `--` in all 47 items that currently use example blocks
- **Modified**: `injectItemHeadings()` regex updated for `--` delimiter (already partially done)

### Impact

- **Code**: One-line change in DocumentParser
- **Example site**: Mass replacement of `====` → `--` across 3 files
- **Rendering**: Clean open blocks without auto-numbering or borders
- **No breaking changes**: `====` still works, just not used in examples
