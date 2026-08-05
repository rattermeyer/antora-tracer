## Context

The example site serves dual purposes: (1) user-facing documentation teaching people to use and extend the Antora Tracer extension, and (2) self-traceability demonstration — the extension tracing its own development artifacts (requirements, architecture, tests). Currently these two concerns share a flat navigation structure, and the user-facing documentation mixes all four Diátaxis modes within monolithic pages.

The Diátaxis framework (https://diataxis.fr) prescribes four distinct documentation modes — Tutorials (learning-oriented), How-to Guides (task-oriented), Reference (information-oriented), Explanation (understanding-oriented) — each targeting a different reader need. The key rule is that pages should serve one mode and not mix them.

The restructuring is purely organizational: splitting pages, updating navigation, and adding cross-references. No content rewriting.

## Goals / Non-Goals

**Goals:**
- Apply Diátaxis structure to the user-facing documentation (user guide, developer guide)
- One page = one mode (no mixing tutorial, how-to, reference, explanation in a single page)
- Group self-traceability demo pages under a distinct "Self-Traceability" nav section
- Add appropriate cross-references between modes following Diátaxis conventions
- Preserve all traceable `[item]` blocks and their source file locations
- Navigation reflects the four modes at the top level

**Non-Goals:**
- No content rewriting — only structural reorganization and page splits
- No changes to the extension code, build process, or CI
- No changes to the self-traceability matrix configuration or graph
- No changes to PDF generation or deployment workflows
- Architecture page (`architecture.adoc`) remains as one page (arc42 narrative + traceability graph integrity)
- No new AsciiDoc syntax or macros

## Decisions

### Decision 1: Four top-level nav sections matching Diátaxis modes

The four Diátaxis modes become the primary navigation sections: Tutorial, How-to Guides, Reference, Explanation. A fifth section — Self-Traceability — houses the dogfooding demo.

**Rationale**: Diátaxis recommends making mode boundaries visible in navigation so readers can self-select based on their need. Making the modes the top-level taxonomy is more important than preserving the current flat list.

**Alternatives considered**:
- Keep current flat nav and just split pages: would lose the mode signal, readers still wouldn't know what mode a page serves
- Three-mode structure (DITA-style, no separate Explanation): would force architectural explanation back into how-to guides, recreating the current mixing problem

### Decision 2: Single Tutorial page

One `getting-started.adoc` covers the full beginner path: install → configure → write first item → build → view output. No digressions into option listings or conceptual explanations.

**Rationale**: Diátaxis tutorials are a guided path. Splitting into multiple tutorial pages would introduce navigation branches, breaking the "follow along" experience.

### Decision 3: How-to pages address specific, named tasks

Each how-to page title answers "How do I X?" — not "X Guide" or "About X":

| Page | Title |
|------|-------|
| `how-to/custom-domain-model.adoc` | How to define a custom domain model |
| `how-to/new-project-setup.adoc` | How to set up traceability for a new project |
| `how-to/write-traceable-items.adoc` | How to write traceable items |
| `how-to/neo4j-export.adoc` | How to export to Neo4j |
| `how-to/partials.adoc` | How to use partial files with items |
| `how-to/visualizations.adoc` | How to add traceability visualizations |
| `how-to/troubleshooting.adoc` | How to troubleshoot common issues |

**Rationale**: Diátaxis how-to titles should be action-oriented and specific. This lets readers scan the nav for their exact problem.

### Decision 4: Reference pages are exhaustive and cross-linked

Each reference page covers one domain exhaustively: every option, every attribute, every command flag. Heavy cross-linking to how-to guides and explanation pages. Reference is the "web" that connects everything.

**Rationale**: Reference is the one mode where readers expect to jump around. Nobody reads reference cover-to-cover.

### Decision 5: Developer guide split into API Reference + Contributor How-to

The current `developer-guide.adoc` is split:
- API signatures, data model interfaces → `reference/api.adoc`
- Contribution workflow, setup, testing conventions → `how-to/contribute.adoc`
- Architectural rationale (why ESM, why regex parser) → cross-referenced from existing ADRs under Explanation

**Rationale**: The developer guide currently serves three different reader intents. Separating them lets contributors find setup steps, integrators find API signatures, and the curious find rationale — without sifting through each other's content.

### Decision 6: Self-Traceability as a distinct nav section

Requirements, use cases, test plan, dashboard go under a "Self-Traceability" nav section. Architecture stays under Explanation (it's arc42) but also appears in Self-Traceability matrices — cross-reference from Self-Traceability → Explanation for that page.

**Rationale**: These pages aren't user-facing documentation — they're the extension applied to itself. Keeping them in the same nav as Tutorial/How-to/Reference would confuse readers who came to learn about the tool. The name "Self-Traceability" signals the meta nature.

### Decision 7: `architecture.adoc` stays as one page under Explanation

Not split into sub-pages. Remains a single arc42 document with traceable items.

**Rationale**: arc42 is designed as a coherent narrative. Splitting would break the flow and complicate the traceability graph (ARC items reference REQ items through inline relationship macros that rely on the graph being populated from a single processing pass). The item-to-section granularity already provides navigable anchors.

### Decision 8: No legacy migration how-to

The `[req]` / `[imp]` legacy macro deprecation is old and documented in the item macro reference. A standalone how-to for migration would have a shelf life measured in versions.

**Rationale**: How-to guides should address current, recurring tasks. Legacy migration is a one-time event for early adopters.

## Risks / Trade-offs

- **[More pages → more navigation depth]**: Going from ~12 pages to ~25-30 adds two clicks to reach some content. Mitigation: Reference and How-to are flat within their sections (no sub-nesting beyond one level), and the Overview page provides a landing page with guided paths for each reader persona.

- **[Split content may lose context]**: A reader following a how-to may need a config option definition that now lives in Reference. Mitigation: heavy cross-linking from How-to → Reference, following Diátaxis conventions (How-to pages freely link to Reference).

- **[items staying in split pages]**: When `user-guide.adoc` is split, some sections contain no traceable items and others do. The split must not move `[item]` blocks out of their source files (they're referenced by existing matrices). Mitigation: architecture.adoc and the self-traceability pages are unchanged. User guide has no traceable items (it's pure documentation, not traced content).

- **[Navigation UX in Antora]**: Antora nav can group items but doesn't natively support "separator headings" that look distinct from link items. The four mode sections will appear as expandable groups. Mitigation: section titles clearly signal the mode, and the landing page explains the structure.
