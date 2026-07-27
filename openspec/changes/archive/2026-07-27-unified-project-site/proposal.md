# Proposal: Unified Project Site

## Why

The project has three separate documentation surfaces that don't connect:

- `README.adoc` — standalone, no navigation to guides
- `docs/user-guide.adoc` + `docs/developer-guide.adoc` — buried, no discovery, no traceability
- `examples/` — self-traceability demo, no user-facing docs

Users discovering the project on npm or GitHub have no clear path to the guides. The self-traceability example shows what the tracer can do but doesn't explain how to use it.

## What Changes

- **Refactor**: Move user guide and developer guide into the example site as regular AsciiDoc pages
- **New**: GitHub Pages deployment via GitHub Actions — the built site becomes the project homepage
- **New**: Package metadata (`repository`, `bugs`, `homepage`) for npm discovery
- **Modified**: `examples/modules/ROOT/nav.adoc` to include user guide and developer guide in navigation
- **Modified**: `docs/` reduced to redirect stubs pointing to the deployed site

### How It Works

```
examples/modules/ROOT/pages/
├── index.adoc              ← landing page
├── user-guide.adoc         ← from docs/ (refactored as page)
├── developer-guide.adoc    ← from docs/ (refactored as page)
├── requirements.adoc       ← 36 [item]s (existing)
├── architecture.adoc       ← 4 [item]s with PlantUML (existing)
├── test-plan.adoc          ← 8 [item]s (existing)
└── traceability/           ← generated matrices (existing)
```

The Antora playbook already has the extension configured. A single `npx antora antora-playbook.yml` builds the complete site with user docs, architecture diagrams, traceability matrices, and clickable links.

GitHub Actions deploys the built `public/` directory to GitHub Pages on every push to main. The `homepage` in package.json points to the deployed URL.

### Impact

- **Code**: No code changes — only content refactoring and CI addition
- **Docs**: User guide and developer guide move from `docs/` to `examples/modules/ROOT/pages/`
- **CI**: New GitHub Actions workflow for Pages deployment
- **Package metadata**: `repository`, `bugs`, `homepage` fields added
- **User Impact**: Single unified site for all project documentation + live traceability demo
