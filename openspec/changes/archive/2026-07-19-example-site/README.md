# Example Antora Site Change

This change creates an example Antora site that demonstrates the Requirements Traceability Extension in action.

## Purpose

Provide users with a working example that they can:
1. Study to understand how the extension works
2. Run locally to see traceability matrices generated
3. Modify to experiment with the extension
4. Use as a reference for their own projects

## Quick Start

To try the example site:

```bash
cd example-site
npm install
npx antora antora.yml
# Open _site/index.html in your browser
```

## What's Included

- Minimal Antora site configuration
- Example requirements, implementations, and architecture
- Traceability links between components
- Generated traceability matrices (HTML and CSV)
- Coverage report
- Side-by-side comparison with Sphinx Needs

## Status

- **Proposal**: ✅ Complete
- **Design**: ✅ Complete
- **Specs**: ✅ Complete
- **Tasks**: 12/15 defined (Phase 1: MVP)
- **Implementation**: Not Started

## Related Changes

- `typescript-refactoring` - Refactored the extension codebase (archived)
- `requirements-traceability` - Original extension implementation (archived)
