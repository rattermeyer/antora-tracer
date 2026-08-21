## 1. Migrate prose pages to `--` delimiters

- [x] 1.1 Convert `[item]` example blocks from `====` to `--` in `tutorial/getting-started.adoc`
- [x] 1.2 Convert in `how-to/write-traceable-items.adoc`
- [x] 1.3 Convert in `how-to/visualizations.adoc`
- [x] 1.4 Convert in `how-to/detect-duplicate-ids.adoc`
- [x] 1.5 Convert in `reference/item-macro.adoc` examples
- [x] 1.6 Convert in `reference/traceability-macros.adoc`
- [x] 1.7 Convert in `explanation/traceability-model.adoc`
- [x] 1.8 Update prose mention in `self-traceability/use-cases.adoc`
- [x] 1.9 Convert in `reference/documentation-style-guide.adoc`

## 2. Document the alternative delimiter

- [x] 2.1 Add a note in `reference/item-macro.adoc` stating `====` also works and describing the rendering difference (open block = inline, example block = boxed)

## 3. Fix getting-started stale facts

- [x] 3.1 Update output paths in `tutorial/getting-started.adoc` (Traceability nav + site `index.html`)
- [x] 3.2 Fix the `requirements-to-design` matrix claim (the example has no design item)
- [x] 3.3 Tighten the "coverage report" phrasing to match actual output (matrices)

## 4. Verify

- [x] 4.1 Rebuild the example site and confirm items still parse and render
