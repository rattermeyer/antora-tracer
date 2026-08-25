## 1. Config schema

- [ ] 1.1 Add `roleGuidance` type (`page`, `idPrefix`) to `TraceabilityConfig`
- [ ] 1.2 Parse and validate `roleGuidance` in `ConfigLoader`
- [ ] 1.3 Merge `roleGuidance` through the `extends` chain

## 2. Default guidance pages

- [ ] 2.1 Create `src/presets/guidance/` with default pages for `requirement`, `design`, `test`, `use_case`
- [ ] 2.2 Convert the `requirements-writing` skill content into the `requirement` guidance page
- [ ] 2.3 Convert the `use-case-engineering` skill content into the `use_case` guidance page
- [ ] 2.4 Wire the preset `roleGuidance` entries to the shipped pages

## 3. CLI command

- [ ] 3.1 Add `role-guidance <role>` command that resolves and reports the page path and `idPrefix`
- [ ] 3.2 Add a `--content` flag to output the resolved page content
- [ ] 3.3 Add tests for resolution (preset default, project override, no guidance)

## 4. Rendering

- [ ] 4.1 Register resolved guidance pages into the content catalog at build time
- [ ] 4.2 Ensure a project override page wins over the shipped default
- [ ] 4.3 Add tests for guidance page registration

## 5. write-item skill

- [ ] 5.1 Create the `write-item` skill that consumes `role-guidance` output
- [ ] 5.2 Apply the guidance page's template and checklist when writing an item
- [ ] 5.3 Use `idPrefix` as a fallback when context does not establish one

## 6. Distribution and docs

- [ ] 6.1 Add the guidance directory to the npm `files` list
- [ ] 6.2 Document `roleGuidance` and the `role-guidance` command in reference docs
- [ ] 6.3 Update the example site and rebuild to verify rendered guidance
