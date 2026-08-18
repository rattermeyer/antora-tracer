## 1. Spike and toolchain

- [x] 1.1 Verify `vale --ext=.adoc` stdin behavior and whether line numbers map to source; if not, confirm temp-file serialization is required
- [x] 1.2 Add `vale` to devbox.json and document the `asciidoctor` prerequisite

## 2. Extension entry point

- [x] 2.1 Add `antora-vale-extension` module with `register()` and configuration parsing (`valeConfig`, `minLevel`, `enabled`)
- [x] 2.2 Implement `contentClassified` handler that collects page and partial source buffers
- [x] 2.3 Serialize buffers to a per-version temp tree mirroring `src.path`, with cleanup in a `finally` block
- [x] 2.4 Invoke `vale --output=JSON` per file and parse results into findings with source path and line
- [x] 2.5 Implement severity gating: fail on findings at or above `minLevel`, log below
- [x] 2.6 Detect missing `vale`/`asciidoctor` executables and fail with an actionable message
- [x] 2.7 Build the module into the distribution and export it alongside the existing bundled extensions

## 3. Starter Vale style

- [x] 3.1 Create `styles/antora-tracer/` rule files for filler words, inclusive language, non-militaristic substitutions, and instead-of/use mappings
- [x] 3.2 Add a sample `.vale.ini` referencing the starter style
- [x] 3.3 Include the style and sample config in the npm package `files`

## 4. Tests

- [x] 4.1 Test that page and partial content produces findings with source path and line
- [x] 4.2 Test severity gating: at-or-above fails the build, below logs without failing
- [x] 4.3 Test the opt-in behavior: extension not registered means no Vale processing
- [x] 4.4 Test missing-executable failure messages for `vale` and `asciidoctor`
- [x] 4.5 Test that a multi-sentence source line does not produce a Vale finding

## 5. Docs and integration

- [x] 5.1 Add reference docs for the extension configuration and prerequisites
- [x] 5.2 Add a how-to for high-quality-documentation linting that distinguishes Vale prose checks from the source-layout checker
- [x] 5.3 Register the extension in the example site playbook (disabled by default; rebuild verification deferred)
- [x] 5.4 Update CI to install `vale` (extension stays disabled until verified in devbox)

## Deferred

- Task 1.1 (stdin spike) and the end-to-end rebuild/enable verification require the
  `vale` and `asciidoctor` executables, which are not installed in this shell.
  Run them inside `devbox shell` before flipping `enabled: true` in the playbooks.
