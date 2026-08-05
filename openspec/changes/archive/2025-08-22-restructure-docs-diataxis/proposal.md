## Why

The example site's user-facing documentation currently mixes all four modes — tutorial, how-to, reference, and explanation — within monolithic pages, particularly `user-guide.adoc` (2,000+ lines) and `developer-guide.adoc` (1,400+ lines). Readers arriving with a specific need (learn from scratch, solve a task, look up an option, or understand the design) must navigate a single undifferentiated document. The Diátaxis framework provides a proven structure for separating these modes into distinct, purpose-built pages.

## What Changes

- Split `user-guide.adoc` into multiple single-mode pages across Tutorial, How-to, Reference, and Explanation categories
- Split `developer-guide.adoc` into a focused contributor How-to, an API Reference page, and architectural Explanation
- Create a new navigation structure with four top-level sections reflecting the Diátaxis modes
- Group self-traceability demo pages (requirements, use cases, test plan, dashboard) under a "Self-Traceability" nav section, clearly separated from user-facing documentation
- Add cross-references between modes following Diátaxis linking conventions (heavy linking between Reference ↔ everything; no links out of Tutorial)
- Keep existing content intact — no rewriting, only structural reorganization and page splits
- Preserve all traceable `[item]` blocks in their source files; architecture.adoc remains as one page to maintain arc42 narrative and traceability graph integrity

## Capabilities

### New Capabilities
- `doc-tutorial`: A single Getting Started tutorial page — learning-oriented, step-by-step, no digressions
- `doc-howto-guides`: Task-oriented how-to pages (custom domain model, new project setup, Neo4j export, partials usage, visualizations, troubleshooting)
- `doc-reference`: Information-oriented reference pages (item macro, traceability macros, configuration, presets, CLI, API)
- `doc-explanation`: Understanding-oriented explanation pages (traceability model, processing pipeline, architecture, ADRs, quality attributes, comparisons)
- `doc-self-traceability`: Grouped nav section for the extension's self-traceability demo pages (requirements, use cases, test plan, dashboard), visually separated from user-facing documentation

### Modified Capabilities
<!-- No existing functional capabilities change — this is a documentation structure-only change -->

## Impact

- Affected files: `examples/component-one/modules/ROOT/pages/*.adoc`, `nav.adoc`
- No code changes to the extension, no API changes, no test changes
- The example site's self-traceability matrices and requirements graph are unaffected (items stay in their source files)
- CI deployment to GitHub Pages continues to work; Antora build is unchanged
