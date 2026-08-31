## 1. Config schema

- [x] 1.1 Add `roleGuidance` type (`page`, `idPrefix`) to `TraceabilityConfig`
- [x] 1.2 Parse and validate `roleGuidance` in `ConfigLoader`
- [x] 1.3 Merge `roleGuidance` through the `extends` chain

## 2. Default guidance pages

- [x] 2.1 Create `src/presets/guidance/` with default pages for `requirement`, `design`, `test`, `use_case`
- [x] 2.2 Convert the `requirements-writing` skill content into the `requirement` guidance page
- [x] 2.3 Convert the `use-case-engineering` skill content into the `use_case` guidance page
- [x] 2.4 Wire the preset `roleGuidance` entries to the shipped pages

## 3. CLI command

- [x] 3.1 Add `role-guidance <role>` command that resolves and reports the page path and `idPrefix`
- [x] 3.2 Add a `--content` flag to output the resolved page content
- [x] 3.3 Add tests for resolution (preset default, project override, no guidance)

## 4. Rendering

- [x] 4.1 Register resolved guidance pages into the content catalog at build time
- [x] 4.2 Ensure a project override page wins over the shipped default
- [x] 4.3 Add tests for guidance page registration

## 5. write-item skill

- [x] 5.1 Create the `write-item` skill that consumes `role-guidance` output
- [x] 5.2 Apply the guidance page's template and checklist when writing an item
- [x] 5.3 Use `idPrefix` as a fallback when context does not establish one

## 6. Distribution and docs

- [x] 6.1 Add the guidance directory to the npm `files` list
- [x] 6.2 Document `roleGuidance` and the `role-guidance` command in reference docs
- [x] 6.3 Update the example site and rebuild to verify rendered guidance
