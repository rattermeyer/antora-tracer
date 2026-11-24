## Context

See proposal.md - Why. The page is a plain AsciiDoc page with a
`tracer:config-graph[]` macro and no `[item]` blocks. Antora resolves `xref:`
targets from the module root, so relative links between the moved page and
`explanation/traceability-model.adoc` keep working after the move. The site
sets `redirect_facility: static` in both playbooks.

## Goals / Non-Goals

**Goals:**
- Relocate the page without changing its content, title, or generated graph.
- Keep the nav and cross-references consistent.

**Non-Goals:**
- Retitling the page or rewriting its prose.
- Renaming the `doc-self-traceability` capability.

## Decisions

**Move the file under `pages/self-traceability/` rather than re-pointing a nav
entry at its current path.** The section a page belongs to is its directory;
leaving the file under `explanation/` while listing it under Self-Traceability
would make the nav contradict the source tree and the Diátaxis split.

**Do not add a `:page-aliases:` attribute for the old URL.** Nothing in the
repo or docs links to `/explanation/our-traceability-model.html`, and the page
is demonstration content, not a stable public entry point. Adding an alias
would introduce the repo's first `page-aliases` usage for a URL no reader
holds. Alternative considered: `:page-aliases: explanation/our-traceability-model.adoc`
to keep the old path resolving; rejected as unused ceremony.

## Risks / Trade-offs

- [Old URL 404s after deploy] → Acceptable: no inbound links exist; the nav and
  the one cross-reference are updated in the same change.
- [Spec enumeration drift] → The `doc-self-traceability` list already omitted
  Delivery Process; this change adds both that page and the moved one so the
  spec matches the nav.