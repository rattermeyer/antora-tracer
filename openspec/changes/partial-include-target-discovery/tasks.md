## 1. Normalize Partial Targets

- [x] 1.1 Refactor partial source and include paths through one normalized target-key function.
- [x] 1.2 Preserve component, module, version, and published-page target metadata.

## 2. Broaden Include Discovery

- [x] 2.1 Match indented partial includes with optional include attributes.
- [x] 2.2 Normalize equivalent absolute, module-relative, and `partials/...` include paths.
- [x] 2.3 Keep unresolved partials on safe fallback paths without source-file URLs.

## 3. Regression Coverage

- [x] 3.1 Add Antora extension tests for include attributes and relative paths.
- [x] 3.2 Add LinkResolver tests for equivalent paths and unresolved partials.
- [x] 3.3 Run the full test suite and TypeScript/format checks.
- [x] 3.4 Rebuild the example site and verify the UC-007 browser link.

## 4. Commit

- [x] 4.1 Create a conventional commit containing the completed fix.
