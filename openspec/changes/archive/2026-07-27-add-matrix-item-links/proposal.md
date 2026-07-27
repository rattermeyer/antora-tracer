## Why

Users viewing the traceability matrix cannot navigate directly to the source item definitions. Currently, matrix cells display item IDs and titles as plain text, requiring users to manually search through AsciiDoc files to locate items for verification or editing. This creates friction in the traceability workflow, especially for large projects with many items across multiple files.

## What Changes

- Add clickable deep links from matrix row items (requirements) to their source HTML pages
- Add clickable deep links from matrix cell items (architecture, tests, etc.) to their source HTML pages
- Links open in the same browser tab (maintaining navigation flow)
- Show source file name as tooltip on hover
- Normalize item `sourceFile` paths at parse time for consistent link generation
- Introduce `LinkResolver` component to generate context-aware links for Antora and CLI usage
- Update HTML matrix template to render items as hyperlinks

**BREAKING**: No breaking changes. Existing functionality preserved when `LinkResolver` is not provided.

## Capabilities

### New Capabilities
- `matrix-item-linking`: Add deep link navigation from matrix cells to item definitions in rendered HTML

### Modified Capabilities

*None* - No existing capability requirements are changing. This is a pure enhancement.

## Impact

- `src/LinkResolver.ts`: New file for path resolution logic
- `src/antora-extension.ts`: Normalize `sourceFile` paths, integrate LinkResolver
- `src/MatrixGenerator.ts`: Accept LinkResolver, generate links for row and cell items
- `src/templates/matrix.html.mustache`: Render items as clickable links with tooltips
- `examples/run-example.js`: Pass CLI context to LinkResolver
