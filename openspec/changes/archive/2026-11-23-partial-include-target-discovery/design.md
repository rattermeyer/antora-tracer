## Context

The extension indexes page-to-partial includes during `contentClassified` so links to items defined in partials can target the page that renders them.
The current scanner only recognizes an empty include attribute list and relies on one path shape.
The installed-package patch that motivated this change uses a broader include matcher, while the source implementation also needs to keep matrix `LinkResolver` behavior aligned.

## Goals / Non-Goals

**Goals:**

- Match `include::partial$...[]` with optional attributes and normal indentation.
- Normalize absolute, module-relative, and `partials/...` paths to one lookup key.
- Preserve component, module, and version qualification.
- Keep AsciiDoc and generated HTML link resolution consistent.
- Retain safe behavior for unresolved targets.

**Non-Goals:**

- Do not support arbitrary non-partial includes as traceability targets.
- Do not change graph item identity or overwrite partial source provenance.
- Do not add configuration or dependencies.
- Do not change the published anchor convention.

## Decisions

### Use one normalized partial-key function

Normalize separators, remove the optional `modules/<module>/` prefix, remove the `partials/` prefix, and remove the `.adoc` suffix before key construction.
Use the same normalization for page include targets and item source paths.
This avoids separate absolute-path and relative-path branches.

### Accept optional include attributes

Match complete include lines with optional whitespace and any attribute content inside brackets.
Trim the captured target and remove any source-relative prefix before normalization.
Do not require the attribute list to be empty.

### Keep target records shared by both link paths

Continue using the existing partial target record/index passed to `buildXref` and `LinkResolver`.
Do not introduce a graph field or duplicate resolution logic in matrix generation.

### Preserve unresolved fallback

If no normalized target exists, relationship links use the existing safe xref fallback and generated matrix links do not emit a partial source URL.
No guessed page is generated from the partial filename.

## Risks / Trade-offs

- A partial may be included by multiple pages; the existing target array remains authoritative and deterministic selection is unchanged.
- Include directives split across lines are outside supported AsciiDoc include syntax for this scanner and remain unresolved.
- Normalization could merge two paths that differ only by redundant source prefixes; this is intentional because they identify the same Antora partial.

## Verification

- Add extension coverage for include attributes and relative partial paths.
- Add LinkResolver coverage for the same forms and unresolved partial fallback.
- Run the full test suite and formatting/type checks.
- Rebuild the example site and verify UC-007 still resolves to the use-case page.
