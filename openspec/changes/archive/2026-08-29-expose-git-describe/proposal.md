## Why

The published site should be able to show its build version (the `git describe` string) in a footer across all output formats — HTML, PDF, and DOCX. Today there is no such value: the HTML-only channels (`site.keys` via the `--key` CLI flag, or a Handlebars helper) never reach the PDF and DOCX pipelines, which consume AsciiDoc document attributes instead of the Handlebars UI model. The extension should compute `git describe` once per build and expose it to both channels, so every backend can print the same version.

## What Changes

- The Antora extension computes `git describe --tags --always --dirty` once per build, from the playbook directory.
- It injects the result as a single `git_describe` key in two places:
  - `site.keys.git_describe` — reachable from HTML Handlebars templates (`{{site.keys.git_describe}}`).
  - `asciidoc.attributes.git_describe` — reachable from AsciiDoc content, the PDF theme, and the DOCX converter (`{git_describe}`).
- When the build runs outside a git repository (or `git` is unavailable), no keys are injected and the build continues unchanged — footers that reference the value simply render nothing.
- The extension's constructor reads the playbook from the second `register` argument (`antoraConfig.playbook`) instead of the `context.playbook` property, which is `undefined` under Antora 3.

## Capabilities

### New Capabilities

- `git-describe`: The extension exposes the `git describe` string as `git_describe` in both the site keys and the document attributes, so HTML, PDF, and DOCX output can render the build version from one source of truth.

### Modified Capabilities

<!-- none -->

## Impact

- **Extension**: `src/antora-extension.ts` — compute the string and inject both keys in the constructor (before Antora freezes the playbook); widen the constructor's `antoraConfig` type to capture `playbook`.
- **Tests**: `test/antora-extension.test.ts` — injection into both channels, plus the non-git-repo fallback.
- **Docs**: reference page for the exposed key and a how-to snippet for footer usage across HTML, PDF, and DOCX.
- **Example site**: demonstrate `git_describe` in the HTML footer/partial and in the PDF/DOCX assembly footers.
- **No config surface**: the feature is always on and harmless when git is absent, so no new extension option is added.
