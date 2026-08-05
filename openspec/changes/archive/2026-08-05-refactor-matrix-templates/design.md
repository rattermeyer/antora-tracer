## Context

The current `matrix.html.mustache` is a ~160-line monolithic template with inline CSS, HTML structure, and Mustache logic all in one file. An earlier change (`externalize-html-templates`) created a separate `design-matrix.html.mustache` template with supporting partials, but this alternate template was never wired into the rendering path. The `MatrixGenerator.exportToHTML()` method always calls `templateRenderer.render("matrix", ...)`, making `design-matrix` and its seven partials dead code.

The `TemplateRenderer` already supports Mustache partials — it loads all `.mustache` files from `partials/` and passes them to Mustache's render function. The refactoring simply needs to split the live `matrix` template into partials that match the existing data contract.

Three dead methods on `MatrixGenerator` (`generateRequirementsMatrix`, `generateDesignMatrix`, `generateAllMatrices`) were helper methods that looked up matrix configs by name but were never called by any code path.

## Goals / Non-Goals

**Goals:**
- Remove dead template files and dead methods
- Split the live `matrix.html.mustache` into a clean main template with partials for styles, header, row rendering, and footer
- Zero change to the HTML output or data contract
- Zero change to `TemplateRenderer` or `MatrixGenerator.exportToHTML()`
- All 194 existing tests pass without modification

**Non-Goals:**
- Changing the data contract between `exportToHTML()` and the template
- Adding new template features or CSS improvements
- Refactoring `design-matrix` — it's being deleted
- Changing how `TemplateRenderer` loads or resolves partials

## Decisions

### Decision 1: Four partials, not two or six

The monolithic template has four natural boundaries:

| Partial | Responsibility | Size |
|---|---|---|
| `styles.mustache` | All CSS rules | ~130 lines |
| `header.mustache` | DOCTYPE, `<head>`, opening `<body>`, page title + metadata | ~15 lines |
| `matrix-row.mustache` | Single `<tr>` with nested `{{#hasItems}}`, `{{#cells}}`, `{{#rowHref}}` logic | ~25 lines |
| `footer.mustache` | Closing `</body></html>` | ~3 lines |

**Alternatives considered:**

- **Six partials** (also splitting coverage-summary and table-header): Over-fragmentation. The coverage summary is ~15 lines with simple `{{#coverage}}` wrapping — extracting it adds an indirection without meaningful reuse. The table header is equally small and tightly coupled to the column data shape.
- **Two partials** (only header/footer): Doesn't address the main pain point — the 130-line CSS block and the deeply nested row logic remain inline.
- **Keep styles inline but extract logic partials**: Separating concerns is the point. CSS is the biggest single block and benefits most from isolation.

### Decision 2: Partial data contract matches existing `templateData`

The new partials receive the exact same `templateData` object that `exportToHTML()` already builds. No intermediate transformation. This means:

- `{{> header}}` receives the full data — accesses `{{name}}`, `{{type}}`, `{{generatedAt}}`
- `{{> matrix-row}}` receives the full data but Mustache's implicit context makes `{{#rows}}` iteration work naturally — each row partial sees `rowId`, `rowTitle`, `cells[]`, `coverage`, `status`, etc.
- `{{> styles}}` and `{{> footer}}` access no template variables

**Alternative considered:** Pre-process rows into a different shape for the partial. Rejected — adds complexity to `prepareRowForTemplate()` with no benefit.

### Decision 3: Partial names follow existing convention

Use the same names (`styles`, `header`, `footer`) as the dead partials being removed, since these are natural names. The `matrix-row` partial is new and named after its purpose.

## Risks / Trade-offs

- **[Risk] Partial name collision with future templates**: If another template later needs its own `header.mustache`, partials are global to the TemplateRenderer. → **Mitigation**: Current project only has one template. If multiple templates are added later, partial naming can be revisited (prefix-based or subdirectory loading).
- **[Risk] CSS specificity changes**: Extracting `<style>` into a partial could inadvertently change whitespace or encoding. → **Mitigation**: Bytes don't change — Mustache renders partials inline character-for-character. The only difference is the file on disk, not the rendered output.
