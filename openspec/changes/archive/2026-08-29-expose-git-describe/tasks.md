## 1. Extension injection

- [x] 1.1 Add a `gitDescribe(dir)` helper that runs `git describe --tags --always --dirty` via `execSync` and returns the trimmed string, or `undefined` on failure
- [x] 1.2 Widen the extension constructor's `antoraConfig` type to `{ config?, playbook? }` and capture `playbook` in a private field
- [x] 1.3 In the constructor, compute the version string from `playbook.dir` and inject `git_describe` into `site.keys` and `asciidoc.attributes` (guard both sections with `??=`)

## 2. Tests

- [x] 2.1 Test `site.keys.git_describe` is set when `git describe` succeeds
- [x] 2.2 Test `asciidoc.attributes.git_describe` is set when `git describe` succeeds
- [x] 2.3 Test neither key is set and the build completes when `git describe` fails (non-git directory)
- [x] 2.4 Test a playbook with no `site` and no `asciidoc` sections still initializes

## 3. Documentation and example site

- [x] 3.1 Document the `git_describe` key in the reference docs
- [x] 3.2 Add a how-to snippet for footer usage across HTML, PDF, and DOCX
- [x] 3.3 Demonstrate `git_describe` in the example site (landing page `{git_describe}`; HTML chrome footer is external, PDF theme file is absent)
- [x] 3.4 Rebuild the example site and verify the footer renders the version
