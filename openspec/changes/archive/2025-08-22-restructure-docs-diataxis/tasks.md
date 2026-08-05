## 1. Create directory structure

- [x] 1.1 Create `pages/tutorial/` directory
- [x] 1.2 Create `pages/how-to/` directory
- [x] 1.3 Create `pages/reference/` directory
- [x] 1.4 Create `pages/explanation/` directory
- [x] 1.5 Create `pages/self-traceability/` directory

## 2. Extract Tutorial page from user-guide.adoc

- [x] 2.1 Create `pages/tutorial/getting-started.adoc` — extract the Getting Started section (numbered steps: install → configure → write items → build → view output), expanded with narrative guidance, no digressions into option listings or conceptual explanations
- [x] 2.2 Add a "Next steps" section at the conclusion linking to relevant How-to guides

## 3. Extract How-to pages from user-guide.adoc and developer-guide.adoc

- [x] 3.1 Create `pages/how-to/new-project-setup.adoc` — project setup from scratch, playbook config, choosing a preset
- [x] 3.2 Create `pages/how-to/custom-domain-model.adoc` — preset init, extends mechanism, adding roles/relations/matrices, relation validation
- [x] 3.3 Create `pages/how-to/write-traceable-items.adoc` — writing items step by step, ID conventions, inline relationships, partials usage
- [x] 3.4 Create `pages/how-to/neo4j-export.adoc` — CSV export, Cypher export, import into Neo4j, example queries
- [x] 3.5 Create `pages/how-to/visualizations.adoc` — enable traceability-graph and traceability-links attributes, add graph/coverage macros to pages
- [x] 3.6 Create `pages/how-to/troubleshooting.adoc` — common issues and fixes extracted from current Troubleshooting section
- [x] 3.7 Create `pages/how-to/contribute.adoc` — extracted from developer-guide.adoc: setup, dev workflow, testing, code style, commit conventions, build & release

## 4. Extract Reference pages from user-guide.adoc and developer-guide.adoc

- [x] 4.1 Create `pages/reference/item-macro.adoc` — [item] syntax, all attributes, inline relationship macros, ID conventions, validation rules, old-macro deprecation note
- [x] 4.2 Create `pages/reference/traceability-macros.adoc` — outgoing, incoming, links, graph, graph-coverage macros with all attributes and options
- [x] 4.3 Create `pages/reference/configuration.adoc` — all playbook options, traceability.yml schema, extends mechanism, relation validation details
- [x] 4.4 Create `pages/reference/presets.adoc` — complete definition of all four built-in presets with roles, relations, matrices, and Neo4j queries
- [x] 4.5 Create `pages/reference/cli.adoc` — every command and subcommand with all flags, options, and examples
- [x] 4.6 Create `pages/reference/api.adoc` — RequirementsTraceabilityExtension, TraceabilityGraph, DocumentParser, MatrixGenerator, Neo4jExporter, TemplateRenderer, ConfigLoader public methods and data model interfaces

## 5. Create Explanation pages

- [x] 5.1 Create `pages/explanation/traceability-model.adoc` — conceptual explanation of roles, relations, matrices (extracted from user-guide "The Traceability Model" section), no syntax reference
- [x] 5.2 Create `pages/explanation/processing-pipeline.adoc` — pass ordering, graph lifecycle diagram, macro expansion pipeline (extracted from architecture.adoc runtime view and developer-guide architecture section)
- [x] 5.3 Move `pages/architecture.adoc` to `pages/explanation/architecture.adoc`
- [x] 5.4 Move `pages/adr/` to `pages/explanation/adr/`
- [x] 5.5 Move `pages/quality/` to `pages/explanation/quality/`
- [x] 5.6 Move `pages/sphinx-comparison.adoc` to `pages/explanation/sphinx-comparison.adoc`
- [x] 5.7 Move `pages/antora-vs-sphinx.adoc` to `pages/explanation/antora-vs-sphinx.adoc`

## 6. Move self-traceability pages

- [x] 6.1 Move `pages/requirements/` content to `pages/self-traceability/requirements/`
- [x] 6.2 Move `pages/use-cases.adoc` to `pages/self-traceability/use-cases.adoc`
- [x] 6.3 Move `pages/test-plan.adoc` to `pages/self-traceability/test-plan.adoc`
- [x] 6.4 Move `pages/dashboard.adoc` to `pages/self-traceability/dashboard.adoc`

## 7. Update navigation

- [x] 7.1 Rewrite `nav.adoc` with Diátaxis-structured sections: Tutorial, How-to Guides, Reference, Explanation, Self-Traceability
- [x] 7.2 Remove old `user-guide.adoc` and `developer-guide.adoc` nav entries

## 8. Update landing page and cross-references

- [x] 8.1 Update `index.adoc` to reflect the new Diátaxis structure — describe the four mode sections, guide readers to the right section based on their need, update all xref links
- [x] 8.2 Add cross-reference links from How-to pages to relevant Reference pages
- [x] 8.3 Add cross-reference links from Explanation pages to relevant Reference and How-to pages
- [x] 8.4 Add cross-reference links from Reference pages to relevant How-to and Explanation pages

## 9. Verify build and self-traceability

- [x] 9.1 Run `npx antora antora-playbook.yml` and verify the site builds without errors
- [x] 9.2 Run `node examples/run-example.js` and verify same item/relationship counts as before (48 items, 82 relationships, 0 validation errors)
- [x] 9.3 Spot-check HTML output: verify navigation structure, page content, and cross-reference links resolve correctly
- [x] 9.4 Verify PDF build (`npx antora antora-playbook-pdf.yml`) still works
- [x] 9.5 Update `examples/run-example.js` input paths if page file locations changed
