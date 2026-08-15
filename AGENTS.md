# AGENTS.md

## Project

Antora Tracer — a role-based requirements traceability extension for Antora/AsciiDoc. Single `[item]` macro with configurable roles, relations, and matrices. Ships with built-in presets, Neo4j export, and CLI.

- **Version**: 0.16.1
- **Language**: TypeScript (strict mode, ESM)
- **Runtime**: Node.js 20+
- **Tests**: 298 passing (Mocha + Chai)
- **Package**: `antora-tracer` on npm

## Development

```bash
npm install
npm run build      # compile src/ → lib/
npm test           # compile + run 298 tests
npm run lint       # biome check
npm run format     # biome format --write
```

Two tsconfigs:
- `tsconfig.json` — production build (`src/` → `lib/`)
- `tsconfig.test.json` — test build (`src/` + `test/` → `lib/`)

Pre-commit hooks: biome lint + format via `pre-commit`.

## Commit Convention

This project follows https://www.conventionalcommits.org/[Conventional Commits].
All commit messages must use the format:

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

Common scopes: `parser`, `cli`, `preset`, `matrix`, `neo4j`, `antora`, `config`, `graph`

Examples: `feat(parser): support escaped inline macros`, `fix(cli): show file location in validation errors`

## Spec-Driven Development

This project uses https://openspec.dev[OpenSpec] for spec-driven development.
All features, fixes, and refactors start as proposals with specs, design, and tasks.

```bash
openspec list                         # active changes
openspec new change "<name>"         # create proposal
/opsx-apply                           # implement tasks
/opsx-archive                         # archive completed change
```

Archived changes: `openspec/changes/archive/`

Skills: `.pi/skills/` — `update-example-site` refreshes the self-traceability example after archiving.

## Consistency

**Documentation is part of the change, not an afterthought.**
Every code change that affects user-facing behavior, configuration, macros, CLI, or APIs MUST include corresponding documentation updates in the same commit.

Before marking a task complete, scan these files for stale content about the changed feature:

| Change type | Documentation to check |
|---|---|
| New/change extension config option | `reference/configuration.adoc`, `reference/traceability-macros.adoc` |
| New/change CLI option | `reference/cli.adoc`, `how-to/contribute.adoc` |
| New/change macro or API | `reference/item-macro.adoc`, `reference/traceability-macros.adoc`, `reference/api.adoc` |
| New/change visualization | `how-to/visualizations.adoc`, `explanation/architecture.adoc` |
| New/change file output | `how-to/contribute.adoc`, `reference/configuration.adoc` |
| New/change env var | `reference/configuration.adoc`, `how-to/contribute.adoc` |
| General behavior change | `reference/item-macro.adoc`, `reference/traceability-macros.adoc`, `how-to/visualizations.adoc` |

When adding a new config option, env var, or feature flag: find every page that mentions sibling options (same reference section, same how-to page) and add the new one.

When code behavior changes, verify consistency across these layers before committing:

| Layer | Check |
|---|---|
| **Tests** | Review test comments for stale workarounds describing old behavior. Update or add tests to cover the new behavior. |
| **Requirements** | `examples/tracer/modules/requirements/pages/index.adoc` — do REQ items need updating to match spec changes? |
| **Reference** | `examples/tracer/modules/ROOT/pages/reference/` — do `item-macro.adoc`, `traceability-macros.adoc`, `api.adoc`, `cli.adoc`, `configuration.adoc` match the new behavior? |
| **How-to guides** | `examples/tracer/modules/ROOT/pages/how-to/` — do task guides (write-traceable-items, visualizations, query-graph, contribute) match? |
| **Explanation** | `examples/tracer/modules/ROOT/pages/explanation/architecture.adoc` — do ARC items describing components need updating? |
| **Specs** | Sync delta specs to main specs (`/opsx-sync`) before archiving. |
| **Example site** | Rebuild with `npx antora antora-playbook.yml` and regenerate matrices with `node examples/run-example.js` to verify self-traceability works. |

After archiving a change, run the `update-example-site` skill to refresh requirements,
architecture, and test-plan documents to reflect the complete current project state.

## Documentation Framework

The example site documentation follows https://diataxis.fr[Diátaxis] — a framework that organizes documentation into four distinct modes, each serving a different reader need. Every page in the example site belongs to exactly one mode:

| Mode | Purpose | Reader asks | Example pages |
|---|---|---|---|
| **Tutorial** | Learning-oriented, step-by-step | "Can you teach me to…?" | `getting-started.adoc` |
| **How-to Guides** | Task-oriented, solving a problem | "How do I…?" | `how-to/custom-domain-model.adoc` |
| **Reference** | Information-oriented, exhaustive | "What does X do?" | `reference/cli.adoc`, `reference/api.adoc` |
| **Explanation** | Understanding-oriented, background | "Why does it work that way?" | `architecture.adoc`, `adr/`, `quality/` |

A fifth section, **Self-Traceability**, groups pages that demonstrate the extension tracing its own development artifacts (requirements, use cases, test plan, dashboard). These are not user-facing documentation — they are the extension applied to itself.

**Key rules when adding or editing documentation:**

- One sentence per line. See https://asciidoctor.org/docs/asciidoc-recommended-practices/#one-sentence-per-line[AsciiDoc Recommended Practices] — this makes pull request diffs line-level and reviews easier.
- One page = one mode. Do not mix tutorial steps, how-to instructions, reference listings, and conceptual explanation in the same page.
- Tutorials should not link out to Reference or Explanation — they are a guided path.
- How-to, Reference, and Explanation pages cross-reference each other freely.
- How-to page titles use the "How to <verb> <object>" format.
- Reference pages are exhaustive — every option, flag, and attribute is documented.

## Architecture

```
src/
├── index.ts                 RequirementsTraceabilityExtension (orchestrator)
├── types.ts                 Item, ItemRelationship interfaces
├── TraceabilityGraph.ts     In-memory graph with query + validation
├── DocumentParser.ts        Regex-based AsciiDoc parser
├── MatrixGenerator.ts       Config-driven matrix generation
├── Neo4jExporter.ts         Neo4j CSV + Cypher export
├── TemplateRenderer.ts      Mustache template loading + rendering
├── antora-extension.ts      Antora extension (events: contentClassified, sitePublished)
├── cli.ts                   Commander CLI (process, matrix, validate, export, stats, preset, next-id, query)
└── config/
    └── TraceabilityConfig.ts ConfigLoader, types, presets
```

**Item syntax**: `[#REQ-001, item, role=requirement, title="Title"]`

**ContentClassified Pass 2** (in antora-extension.ts):
1. `substituteRelationshipLinks` — replace `addresses:REQ-001[]` with Asciidoctor xrefs
2. `injectTitleIds` — prepend ID to title attribute for visible display

## Example Site

`examples/tracer/modules/` — self-traceability site built with Antora.
`antora-playbook.yml` at project root. Requires UI bundle (cached from GitLab).

```bash
npx antora antora-playbook.yml       # build HTML site
npx antora antora-playbook-pdf.yml   # build PDF (requires Ruby)
node examples/run-example.js         # generate matrices via CLI
```

### PDF Output

PDF generation uses the `@antora/pdf-extension` with Ruby's `asciidoctor-pdf` gem.
Easiest setup is via devbox:

```bash
devbox shell                        # installs Node.js + Ruby + deps
npx antora antora-playbook-pdf.yml  # output → public/pdf/
```

Without devbox, install Ruby 3.x and run:

```bash
bundle install                      # install asciidoctor-pdf gem
npm install
npx antora antora-playbook-pdf.yml
```

## CI

GitHub Actions:
- `.github/workflows/ci.yml` — build + test + lint on push/PR
- `.github/workflows/pages.yml` — deploy example site to GitHub Pages
