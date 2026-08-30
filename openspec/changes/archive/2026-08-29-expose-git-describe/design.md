## Context

Antora's pipeline freezes the playbook early: extensions are constructed, then `playbookBuilt` fires, then `deepFreeze(playbook)` runs (`@antora/site-generator/lib/generate-site.js`), then `resolveAsciiDocConfig(playbook)` reads `playbook.asciidoc.attributes`. Any value we want reachable from documents and templates must therefore be written into the playbook in the extension constructor (or a `playbookBuilt` listener), before the freeze.

Two distinct render channels need the value:

- **HTML** — the Handlebars page composer reads `site.keys` (`@antora/page-composer/lib/build-ui-model.js`: `model.keys = Object.assign({}, playbook.site.keys)`). Reachable as `{{site.keys.git_describe}}`.
- **PDF and DOCX** — `@antora/assembler` converts assembled AsciiDoc with `asciidoctor-pdf` / `adoc-to-docx`, passing document attributes as `-a name=value` args (`@antora/assembler/lib/assemble-content.js`, `prepareConvertAttributes`). Those attributes originate from `playbook.asciidoc.attributes` (`@antora/asciidoc-loader/lib/config/resolve-asciidoc-config.js`). Reachable as `{git_describe}` in AsciiDoc content and in the PDF/DOCX theme footers.

The extension already receives the playbook as the second `register` argument (`antoraConfig.playbook`). Its current `this.context.playbook` is `undefined` under Antora 3 — the `GeneratorContext` has no `playbook` property — so that access silently falls back to `process.cwd()`.

## Goals / Non-Goals

**Goals:**

- Compute the `git describe` string once per build and expose it under one key to both render channels.
- Zero config surface; the build still succeeds when git is unavailable.
- Fix the extension's playbook access to use the documented `antoraConfig.playbook` argument.

**Non-Goals:**

- Additional git fields (`git_commit`, `git_branch`) — add later if a consumer needs them.
- A CLI command or an extension config option to toggle this.
- Footer styling — that stays in the UI theme and the PDF/DOCX assembly configs.

## Decisions

1. **Inject in the extension constructor, not a `playbookBuilt` listener.** The constructor already runs before the freeze and receives `antoraConfig.playbook` directly; a listener would add an event registration for no benefit.
2. **Read the playbook from `antoraConfig.playbook`.** This is the real playbook under Antora 3 and fixes the latent `context.playbook` fallback. Widen the constructor's `antoraConfig` type to `{ config?, playbook? }`.
3. **One snake_case key, `git_describe`, in both channels.** Handlebars cannot parse a hyphenated segment (`{{site.keys.git-describe}}` is parsed as subtraction), and Antora's own convention is snake_case (`site.keys.google_analytics`). AsciiDoc accepts `{git_describe}` fine, so one key name works everywhere.
4. **Inject into both `site.keys` and `asciidoc.attributes`.** `site.keys` reaches the HTML chrome; `asciidoc.attributes` reaches AsciiDoc content, the PDF theme, and the DOCX converter. Guard with `??=` so a playbook that omits either section still works.
5. **`git describe --tags --always --dirty`, run from `playbook.dir`** via `execSync`, wrapped in try/catch. On any failure, inject nothing and continue. `--always` yields a commit hash when no tags exist; `--dirty` marks uncommitted changes.
6. **Always-on, no config option.** The keys are inert unless a footer references them, so gating would be config for a value that never needs to be disabled.

**Alternatives considered:**

- *Handlebars helper in the UI theme* — HTML-only (never reaches PDF/DOCX), and invokes `execSync` once per page unless memoized. Rejected: wrong channel for the PDF/DOCX requirement.
- *`--key git_describe=…` CLI flag* — HTML-only (`site.keys`) and only works through the CLI, not the library API. Rejected for the same reason.
- *Dedicated mini-extension* — more cohesive than growing the traceability extension, but a second package to maintain for one key. Rejected for now; revisit if more site-metadata concerns accumulate.

## Risks / Trade-offs

- [Mutating a frozen playbook throws] → Inject in the constructor, before `deepFreeze`; the timing is verified against the installed Antora version.
- [Subprocess cost] → One `execSync` per build (~ms), fixed argument list with no user-controlled input.
- [Key collision with user content] → `git_describe` is namespaced and documented; overwriting a user value is acceptable since the extension is the authoritative build-version source.
- [Environment-dependent output] → `--always` covers tagless/shallow clones; the failure path injects nothing, so a non-git build is indistinguishable from today.

## Migration Plan

Additive and opt-in: existing builds silently gain the two keys; no output changes until a footer references `{git_describe}` / `{{site.keys.git_describe}}`. No rollback needed beyond removing the reference.

## Open Questions

None blocking. Future extension point (out of scope): expose `git_commit` and `git_branch` alongside `git_describe` if a consumer asks.
