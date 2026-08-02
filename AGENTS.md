# AGENTS.md

## Project

Antora Tracer — a role-based requirements traceability extension for Antora/AsciiDoc. Single `[item]` macro with configurable roles, relations, and matrices. Ships with built-in presets, Neo4j export, and CLI.

- **Version**: 0.7.0
- **Language**: TypeScript (strict mode, ESM)
- **Runtime**: Node.js 20+
- **Tests**: 194 passing (Mocha + Chai)
- **Package**: `antora-tracer` on npm

## Development

```bash
npm install
npm run build      # compile src/ → lib/
npm test           # compile + run 194 tests
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

When code behavior changes, verify consistency across these layers before committing:

| Layer | Check |
|---|---|
| **Tests** | Review test comments for stale workarounds describing old behavior. Update or add tests to cover the new behavior. |
| **Requirements** | `examples/modules/ROOT/pages/requirements.adoc` — do REQ items need updating to match spec changes? |
| **User Guide** | `examples/modules/ROOT/pages/user-guide.adoc` — does the macro/API description match the new behavior? |
| **Architecture** | `examples/modules/ROOT/pages/architecture.adoc` — do ARC items describing components (e.g., toDot, graph macros) need updating? |
| **Developer Guide** | `examples/modules/ROOT/pages/developer-guide.adoc` — does the API reference need changes? |
| **Specs** | Sync delta specs to main specs (`/opsx-sync`) before archiving. |
| **Example site** | Rebuild with `npx antora antora-playbook.yml` and regenerate matrices with `node examples/run-example.js` to verify self-traceability works. |

After archiving a change, run the `update-example-site` skill to refresh requirements,
architecture, and test-plan documents to reflect the complete current project state.

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
├── cli.ts                   Commander CLI (process, matrix, validate, export, stats, preset)
└── config/
    └── TraceabilityConfig.ts ConfigLoader, types, presets
```

**Item syntax**: `[#REQ-001, item, role=requirement, title="Title"]`

**ContentClassified Pass 2** (in antora-extension.ts):
1. `substituteRelationshipLinks` — replace `addresses:REQ-001[]` with Asciidoctor xrefs
2. `injectTitleIds` — prepend ID to title attribute for visible display

## Example Site

`examples/modules/ROOT/pages/` — self-traceability site built with Antora.
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
