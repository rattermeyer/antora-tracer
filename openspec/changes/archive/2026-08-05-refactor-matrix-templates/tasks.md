## 1. Remove dead code

- [x] 1.1 Delete `src/templates/design-matrix.html.mustache`
- [x] 1.2 Delete `src/templates/partials/` directory (7 files: breadcrumb, design-row, footer, header, requirement-row, summary, styles)
- [x] 1.3 Remove dead methods from `src/MatrixGenerator.ts`: `generateRequirementsMatrix()`, `generateDesignMatrix()`, `generateAllMatrices()`
- [x] 1.4 Run `npm test` to verify 194 tests pass after dead code removal

## 2. Create new partials for matrix template

- [x] 2.1 Create `src/templates/partials/styles.mustache` — extract all CSS from `matrix.html.mustache` into this partial
- [x] 2.2 Create `src/templates/partials/header.mustache` — DOCTYPE, `<head>`, opening `<body>`, page title and metadata line
- [x] 2.3 Create `src/templates/partials/matrix-row.mustache` — single `<tr>` with `{{#hasItems}}`, `{{#cells}}`, `{{#rowHref}}` logic from the existing row template
- [x] 2.4 Create `src/templates/partials/footer.mustache` — closing `</body></html>`

## 3. Refactor main template

- [x] 3.1 Rewrite `src/templates/matrix.html.mustache` to use `{{> styles}}`, `{{> header}}`, `{{> matrix-row}}`, and `{{> footer}}` partials — preserve coverage summary and table header inline
- [x] 3.2 Run `npm test` to verify 194 tests pass and HTML output is structurally identical
- [x] 3.3 Run `npx antora antora-playbook.yml` and `node examples/run-example.js` to verify matrix generation in the example site
