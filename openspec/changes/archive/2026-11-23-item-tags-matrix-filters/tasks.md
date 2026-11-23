## 1. Item Tags

- [x] 1.1 Add normalized `tags` to the item type and parse comma-separated header tags into it; verify quoted tags, whitespace, empty entries, and existing custom attributes in parser tests.
- [x] 1.2 Update item macro documentation for the `tags` header attribute; verify the reference documents delimiter and omitted-tag behavior.

## 2. Safe Matrix Row Filters

- [x] 2.1 Add and validate the constrained `rowFilter` grammar for status comparisons and tag membership with `and`, `or`, and parentheses; verify supported expressions and matrix-named errors for unsupported syntax.
- [x] 2.2 Apply validated filters to current matrix row items without changing column selection or coverage; verify matching, non-matching, no-filter, and superseded-row behavior in matrix tests.
- [x] 2.3 Document `rowFilter` syntax and examples in the matrix configuration reference; verify docs match the implemented grammar.

## 3. Integration Verification

- [x] 3.1 Run the focused parser, config-loader, and matrix-generator tests plus build and lint; verify existing unfiltered matrix behavior remains compatible.
