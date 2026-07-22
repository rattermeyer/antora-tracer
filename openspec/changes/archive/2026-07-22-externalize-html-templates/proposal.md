## Why

The current `MatrixGenerator` class embeds HTML generation directly in the `exportToHTML()` and `exportDesignMatrixToHTML()` methods using hundreds of string concatenation calls (`html.push()`). This creates significant code duplication (both methods share ~90% identical CSS and structure), poor maintainability, and makes it impossible for users to customize the HTML output without modifying source code.

Externalizing HTML generation using Mustache templates will:
- Eliminate ~200 lines of duplicated code between the two HTML export methods
- Separate presentation logic from business logic
- Enable users to provide custom templates for their Antora projects
- Make the codebase more maintainable and easier to modify

## What Changes

- **New**: Add Mustache templating library as a dependency
- **New**: Create template files for matrix HTML output (requirements matrix, design matrix)
- **New**: Create reusable partial templates (header, footer, styles, table rows, summary)
- **Modified**: Refactor `MatrixGenerator.exportToHTML()` to use Mustache templates
- **Modified**: Refactor `MatrixGenerator.exportDesignMatrixToHTML()` to use Mustache templates (or merge with main method)
- **New**: Add template loading and rendering utilities
- **Modified**: Update `MatrixGenerator` to accept optional custom template paths

## Capabilities

### New Capabilities
- `html-templates`: External Mustache templates for HTML matrix generation
- `template-customization`: Allow users to provide custom templates for matrix output

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **Code**: ~400 lines of string concatenation replaced with ~50 lines of template rendering code + template files
- **Dependencies**: Add `mustache` package (~20KB minified)
- **API**: `MatrixGenerator` constructor may accept optional template configuration
- **Files**: New `src/templates/` directory with Mustache template files
- **Build**: No impact - templates are loaded at runtime
- **Performance**: Minimal impact - template compilation is fast and can be cached
