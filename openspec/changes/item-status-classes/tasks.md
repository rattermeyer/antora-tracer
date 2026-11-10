## 1. Header recognition

- [x] 1.1 Generalize the item-header class group from `(?:\.tracer)?#` to `(?:\.[A-Za-z0-9_-]+)*#` at all six sites (`src/DocumentParser.ts:158`, `src/antora-extension.ts:457`, `:1967`, `:2026`, `:2448`, `src/cli.ts:266`), and verify `pnpm test` passes with no change to existing header tests
- [x] 1.2 Add tests covering `[.tracer.status-draft#REQ-001, item, role=requirement]` recognition in the parser, in macro expansion, in superseded-block stripping, and in CLI item location; verify each new test fails against the unmodified `(?:\.tracer)?#` pattern before the change lands
- [x] 1.3 Verify the superseded-stripping path removes a block whose header carries a status class (`antora-extension.ts:2448`), which currently matches only the `.tracer` form

## 2. Status class emission

- [x] 2.1 Implement status-slug derivation (lowercase, non-alphanumeric runs to `-`, trim dashes, empty result emits nothing) and verify unit tests cover `draft`, `In Review`, `2.1`, `open/closed`, `DRAFT`, and empty/whitespace input
- [x] 2.2 Emit `tracer-status-<slug>` on item headers in the existing title-injection pass (`injectTitleIds`), idempotently, and verify a rendered item gains the class while its anchor, semantic role class, and title are unchanged
- [x] 2.3 Verify an item with no `status` emits no status-namespaced class and its rendered block is otherwise unchanged

## 3. Non-interference

- [x] 3.1 Verify graph output is unchanged for items with statuses (stored status, attributes, relationships identical) by running the existing graph and snapshot tests
- [x] 3.2 Verify matrix output is unchanged for roles containing items with statuses, and that a matrix coverage class and an item status class with the same derived name remain distinguishable by namespace

## 4. Example site

- [x] 4.1 Add a stylesheet rule demonstrating a status-class decoration, scoped so it is visibly opt-in, and verify by building the site (`pnpm exec antora antora-playbook.yml`) and inspecting the rendered item block for `REQ-355` (`requirements/pages/index.adoc`, `status=draft`)

## 5. Documentation

- [x] 5.1 Document class emission, the slug rule, and the stylesheet example in `reference/item-macro.adoc`, and verify the page builds and states that the class is emitted unconditionally
- [x] 5.2 Record in `reference/configuration.adoc` that no configuration option governs class emission, and verify the option tables and sibling sections list no stale or missing entry
- [x] 5.3 Verify the docs/changelog consistency table in `AGENTS.md` is satisfied for a rendering behavior change: `reference/item-macro.adoc`, `reference/traceability-macros.adoc`, and `how-to/visualizations.adoc` reviewed for stale statements about item block classes

## 6. Release

- [x] 6.1 Add a CHANGELOG entry and verify the release check test passes
- [x] 6.2 Run `pnpm run build && pnpm test && pnpm run lint` and verify the full suite and lint pass
