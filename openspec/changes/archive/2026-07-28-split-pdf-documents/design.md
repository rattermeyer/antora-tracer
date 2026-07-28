## Context

The `add-pdf-output` change introduced PDF generation via `@antora/pdf-extension@1.0.0-beta.20`. Currently, one assembler config file (`antora-assembler-pdf.yml`) produces a single PDF containing all pages in the navigation tree. The assembler supports multiple config files and component-level profiles with custom nav files, enabling per-document PDFs.

## Goals / Non-Goals

**Goals:**
- Generate separate PDFs for requirements, architecture, and test-plan
- Each PDF contains only the pages relevant to that document
- HTML site build and existing single-PDF output remain unchanged
- Use the assembler's built-in profile mechanism (no code changes)

**Non-Goals:**
- Separate PDFs for user-guide, developer-guide, comparison page (these remain in the single PDF only)
- Custom PDF naming beyond what the assembler profile system provides
- Changing the HTML site navigation

## Decisions

### 1. Assembler profiles with custom nav files

**Decision**: Define three profiles in `examples/antora.yml` under `ext.assembler`, each with a dedicated nav file.

**Rationale**: The assembler's `generateSelectAssemblyProfile` function looks up `baseModel.profile` against the component descriptor's `ext.assembler` array. Each profile can specify a different `nav` file, which replaces the default navigation — causing the assembler to produce an assembly file containing only those pages.

**Alternatives considered**:
- `rootLevel` manipulation: Setting `rootLevel: 2` would split nav entries at level 2 into separate files, but our nav groups requirements/architecture/test-plan under "Example" at level 1, so they'd remain grouped. Not viable.
- Separate playbooks: Three separate Antora playbooks with different content filters would work but be more complex to maintain. Profiles are a single-config approach.

### 2. Three assembler config files with a shared base

**Decision**: Create `antora-assembler-pdf-requirements.yml`, `antora-assembler-pdf-architecture.yml`, `antora-assembler-pdf-test-plan.yml`, each setting `assembly.profile` to the matching profile name. Common build settings (command, publish, keepSource) are duplicated across files.

**Rationale**: The assembler's `configure.js` iterates over `config.configFiles` (plural), calling `assembleContent` once per config source. Each call produces a separate assembly → separate PDF. Keeping config files self-contained avoids inheritance complexity.

### 3. Nav files contain single xrefs

**Decision**: Create `nav-requirements.adoc`, `nav-architecture.adoc`, `nav-test-plan.adoc`, each containing a single xref to the target page.

**Rationale**: The assembler's `buildAlternateNavigation` function processes nav files to build the navigation tree used for assembly. Single-xref nav files produce a navigation tree with just that one page, resulting in a PDF containing only that page's content (plus its AsciiDoc includes).

## Risks / Trade-offs

- **Config duplication**: Build settings are duplicated across three config files. → Acceptable; each file is small (~6 lines) and settings rarely change.
- **Profile naming convention**: The profile name must match between the config file and the component descriptor. Inconsistency produces an empty PDF. → Mitigated by using explicit, descriptive names (`pdf-requirements` etc.).
- **Cross-document links**: xrefs between documents won't resolve correctly since only one document is assembled at a time. → Acceptable; cross-document links show as unresolved in PDF but the content is still readable.
