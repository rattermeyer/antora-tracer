## Context

Antora Tracer already extends the Antora build through a main extension (`src/antora-extension.ts`) that processes in-memory source buffers during the `contentClassified` event, plus bundled DOCX and PDF extensions. The project has also introduced a documentation style guide and a source-layout checker.

Vale is a standalone prose linter (a Go binary). It lints AsciiDoc by shelling out to the external `asciidoctor` executable, which must be on `$PATH`. The existing third-party `@axoniq/antora-vale-extension` runs Vale on the published HTML output during `sitePublished` and fails the build via `context.stop(1)`. Its value is that it sees the complete merged content catalog.

## Goals / Non-Goals

**Goals:**
- Run Vale during the Antora build against the source AsciiDoc of the complete content catalog.
- Report findings with source file and line references so authors can act on them.
- Gate the build according to a configurable minimum severity, mirroring the existing `allowDuplicateIds` opt-out pattern.
- Ship a starter Vale style encoding the machine-checkable parts of the documentation style guide.
- Keep the extension opt-in and independent of the traceability graph.

**Non-Goals:**
- Enforcing source layout (one sentence per line) — owned by the existing `check-one-sentence-per-line.js` checker.
- Bundling or auto-installing the `vale` or `asciidoctor` binaries.
- Linting the rendered site output (generated matrices, navigation, macro output).
- Providing an interactive editor integration or Language Server Protocol tooling.

## Decisions

### 1. Use `contentClassified` to lint source, not `sitePublished` on rendered HTML

**Decision**: Run Vale during `contentClassified` against the source `.adoc` buffers.

**Rationale**: Source file and line references are the primary usability requirement; `sitePublished` only exposes rendered HTML whose line numbers do not map to source. `contentClassified` also fails earlier, before the expensive HTML/PDF/DOCX render, which keeps feedback fast for authors.

**Alternatives considered**:
- `sitePublished` (AxonIQ approach): files already on disk, no serialization, but HTML line numbers and slow feedback. Rejected.
- `documentsConverted`: rendered HTML in memory, but still no source line mapping. Rejected.
- CI-only `vale <dir>`: simplest, but does not see the complete merged catalog for users with distributed content sources. Rejected for the extension, acceptable for local use.

### 2. Pipe each buffer via stdin with `--path`, one Vale process per file

**Decision**: Pipe each in-memory page and partial buffer to `vale --output=JSON --path=<sourcePath>` via stdin, running one Vale process per file.

**Rationale**: The spike confirmed that `vale --path=<source>` on stdin reports the real source path and correct source line numbers (vale 3.15.2 + asciidoctor 2.0.26). This avoids temp-file serialization, directory cleanup, and path remapping while keeping per-file attribution and fail isolation.

**Alternatives considered**:
- Temp-tree serialization: previously chosen and verified, but adds filesystem state and cleanup for no benefit once stdin was proven equivalent.
- One `vale <tempdir>` run over the whole tree: single process, but results must be remapped from temp paths back to source paths. Rejected in favor of per-file attribution.

### 3. Severity gating mirrors the duplicate-ID opt-out pattern

**Decision**: The extension reads a `minLevel` config value (`suggestion`, `warning`, or `error`). Findings at or above `minLevel` fail the build; findings below are logged. Vale's `--minAlertLevel` matches this directly.

**Rationale**: Prose rules are fuzzy; hard-failing on every suggestion would block authors. The three-level Vale severity maps naturally to a single `minLevel` knob, consistent with the existing `allowDuplicateIds` escape hatch.

### 4. Ship a starter style, but never require it

**Decision**: Ship `styles/antora-tracer/` as a starter Vale style and a sample `.vale.ini`, but the extension only invokes the user's configured Vale config. The starter style is used by the project's own site, not forced on users.

**Rationale**: The project's style guide is the natural source for machine-checkable rules, and the project should dogfood them. But the extension must stay agnostic to which styles a user chooses.

### 5. Separate extension entry point, bundled in the same npm package

**Decision**: Add a `antora-vale-extension` module distributed alongside the existing bundled extensions, registered independently in a playbook.

**Rationale**: Keeps prose linting decoupled from the traceability graph and allows enabling either independently. Bundling avoids a second package and matches how DOCX and PDF extensions ship.

### 6. Vale and asciidoctor are external prerequisites

**Decision**: The extension shells out to `vale` and `asciidoctor` and fails with an actionable message when either is missing, rather than attempting to install or bundle them.

**Rationale**: `vale` is a Go binary and `asciidoctor` is a Ruby gem; both have existing distribution channels (devbox, nixpkgs, brew). Bundling them would introduce licensing, size, and platform concerns.

## Risks / Trade-offs

- **Line-number fidelity**: Vale's AsciiDoc support converts via Asciidoctor; reported line numbers may not always map cleanly to source lines. → Mitigation: spike `vale --ext=.adoc` output during implementation; if line numbers are unusable, fall back to `--path` with the original file path.
- **Per-file process overhead**: Spawning one Vale process per file scales linearly and may be slow on large sites. → Mitigation: `minLevel` lets users raise the bar; revisit a single-process strategy if needed.
- **Temp-dir content**: Serialized buffers may be read-only or large. → Mitigation: use a per-version temp dir and remove it in a `finally` block.
- **Missing binaries**: Users without `vale`/`asciidoctor` who enable the extension would hit opaque failures. → Mitigation: fail fast with a clear message and document the prerequisite.

## Migration Plan

- Add the extension entry point and register it in the example site playbook under `antora.extensions`.
- Add `vale` (and confirm `asciidoctor` via Ruby) to the `devbox.json` toolchain and CI environment.
- Update the existing `check-one-sentence-per-line.js` docs to clarify the division of labor: Vale handles prose, the checker handles source layout.
- Rebuild the example site to verify the extension runs and the starter style produces no errors on the current docs.

## Open Questions

- ~~Does `vale --ext=.adoc` on stdin report correct source line numbers?~~ Resolved: yes — `vale --path=<source>` on stdin reports the real path and correct source line numbers (verified with vale 3.15.2 + asciidoctor 2.0.26). Temp-file serialization is optional, not mandatory.
- Should `vale sync` (fetch remote style packages) run at build time, or be a documented manual step? Remote fetching introduces a network dependency inside the build.
