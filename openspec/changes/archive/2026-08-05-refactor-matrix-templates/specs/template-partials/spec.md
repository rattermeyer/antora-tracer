## ADDED Requirements

### Requirement: Matrix template uses partials for structure
The `matrix.html.mustache` template SHALL be split into a main template and four Mustache partials (`styles`, `header`, `matrix-row`, `footer`) loaded from the `partials/` subdirectory.

#### Scenario: Main template references partials
- **WHEN** `TemplateRenderer.render("matrix", data)` is called
- **THEN** Mustache SHALL resolve `{{> styles}}`, `{{> header}}`, `{{> matrix-row}}`, and `{{> footer}}` partials from the `partials/` directory
- **AND** the rendered HTML output SHALL be structurally identical to the pre-refactor monolithic template output

#### Scenario: Styles partial contains all CSS
- **WHEN** the matrix template is rendered
- **THEN** all CSS rules SHALL be provided by the `styles.mustache` partial
- **AND** no CSS rules SHALL remain inline in the main template

#### Scenario: Matrix row partial handles all row variations
- **WHEN** a matrix row has linked items in its cells
- **THEN** the `matrix-row.mustache` partial SHALL render item links with `{{#itemHref}}` wrapping
- **WHEN** a matrix row has empty cells
- **THEN** the `matrix-row.mustache` partial SHALL render empty-cell placeholders via `{{^hasItems}}`
- **WHEN** a matrix row has a linkable row ID
- **THEN** the `matrix-row.mustache` partial SHALL render a link via `{{#rowHref}}`

### Requirement: Dead design-matrix template is removed
The `design-matrix.html.mustache` template and all seven partials in `src/templates/partials/` SHALL be removed, as they are not rendered by any code path.

#### Scenario: TemplateRenderer loads only the live template
- **WHEN** `TemplateRenderer` initializes from the templates directory
- **THEN** `design-matrix` SHALL NOT appear in the available templates list
- **AND** the `partials/` directory SHALL contain only `styles.mustache`, `header.mustache`, `matrix-row.mustache`, and `footer.mustache`

#### Scenario: exportToHTML still produces valid output
- **WHEN** `MatrixGenerator.exportToHTML(matrix)` is called after removing dead templates
- **THEN** the returned HTML string SHALL contain `<html>`, `</html>`, `<table>`, and `</table>` tags
- **AND** the HTML SHALL render a complete traceability matrix in a browser

### Requirement: Dead MatrixGenerator methods are removed
The `generateRequirementsMatrix()`, `generateDesignMatrix()`, and `generateAllMatrices()` methods SHALL be removed from `MatrixGenerator.ts` as they are not called by any code path.

#### Scenario: Matrix generation still works via generateMatrix
- **WHEN** `MatrixGenerator.generateMatrix()` is called with no arguments
- **THEN** the method SHALL return a valid `GeneratedMatrix` object
- **AND** `exportToHTML()` SHALL render that matrix to HTML without errors
