## Context

The project is deployed to GitHub Pages via `.github/workflows/pages.yml`. Currently, `antora-playbook.yml` sets `output.dir: ./public` with `clean: true`, meaning the Antora build output is the entirety of what gets deployed. The root `index.html` is a bare meta-refresh redirect to `tracer/0.7.0/index.html`.

We want to add a landing page at the root that introduces the project before visitors enter the documentation. This requires the landing page and Antora docs to coexist under the same `public/` directory tree — the landing page at root, Antora docs at `/docs/`.

Two audiences are targeted:

1. **Developers & Architects** — comfortable with docs-as-code, Git, CLI, AsciiDoc. They want traceability without leaving their tools.
2. **Requirements Engineers & PMs** — coming from GUI traceability tools, less comfortable with markup. They need visual traceability evidence for compliance and are interested in AI-assisted authoring.

## Goals / Non-Goals

**Goals:**
- Serve a visually appealing, single-page landing page at the GitHub Pages root (`/`)
- Present features in a way that resonates with both persona groups
- Include a traceability visualization preview linking to the live matrices
- Describe the AI-assisted workflow as an on-ramp for non-editor users
- Keep the existing Antora documentation site accessible at `/docs/`
- Use minimal tooling: static HTML + Tailwind CSS CDN (no build step, no npm dependency)

**Non-Goals:**
- Adding a build step or static site generator (Astro, 11ty, etc.)
- Modifying the Antora UI bundle or theme
- Interactive/animated traceability graph (the live matrices in the docs serve that purpose)
- Polarion/Sphinx/competitor comparison content
- Changing the Antora content or extension source code

## Decisions

### D1: Static HTML with Tailwind CSS CDN

**Choice**: Single `landing/index.html` file with `<script src="https://cdn.tailwindcss.com">`.

**Alternatives considered**:
- **Astro/11ty**: Adds a build step and dev dependency. Overkill for a page that changes infrequently.
- **Plain CSS**: Re-inventing responsive utilities, grid, typography scale. Tailwind provides all of this via CDN at ~70KB gzipped.
- **Tailwind CLI compile**: Adds a build step. The CDN approach defers optimization; a compiled CSS file can be swapped in later if needed.

**Rationale**: The landing page is relatively static. The CDN approach means zero tooling overhead. If performance becomes a concern, the Tailwind CDN can be replaced with a compiled subset later — the class names stay the same.

### D2: Landing page source in `landing/` directory

**Choice**: `landing/` at repo root, containing `index.html`, `css/landing.css`, and any static assets. CI copies `landing/*` to `public/`.

**Alternatives considered**:
- **Single file at repo root**: No room for CSS, images, favicon without cluttering the project root.
- **Build step in landing/**: Unnecessary. The "build" is a `cp -r` in CI.

**Rationale**: A dedicated directory keeps landing page assets organized and out of the way of source, test, and build artifacts.

### D3: Antora output to `public/docs/`

**Choice**: Change `antora-playbook.yml` `output.dir` from `./public` to `./public/docs`.

**Rationale**: Antora's `clean: true` scopes its cleanup to the output directory. With `output.dir: ./public/docs`, Antora cleans only `public/docs/`, leaving the landing page assets at `public/` untouched. The CI workflow builds Antora first (or second — order doesn't matter since they target different subdirectories), then copies landing page assets.

### D4: CI workflow order

**Choice**: Build Antora first (output to `public/docs/`), then copy `landing/*` to `public/`.

**Rationale**: Antora's `clean: true` only affects its output dir (`public/docs/`). Copying landing page assets after ensures they aren't affected regardless. This order is defensive and makes the separation explicit.

### D5: No custom domain, no separate repo

**Choice**: Keep the existing single-repo, single-GitHub-Pages setup.

**Rationale**: The project already uses GitHub Pages from this repo. Adding a second repo or custom domain adds management overhead without proportional benefit.

## Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  NAV (sticky, minimal)                                [Docs] [GitHub]
├──────────────────────────────────────────────────────────────────┤
│  HERO — project name, one-line description, badges, CTAs         │
├──────────────────────────────────────────────────────────────────┤
│  HOW IT WORKS — architecture diagram (ASCII → Antora → Matrices) │
├──────────────────────────────────────────────────────────────────┤
│  TWO-COLUMN FEATURES                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐         │
│  │ For Developers &       │  │ For REs & Project      │         │
│  │ Architects             │  │ Managers               │         │
│  │ • Git-native           │  │ • Visual traceability  │         │
│  │ • CI/CD integrated     │  │ • Coverage at a glance │         │
│  │ • CLI + API            │  │ • Neo4j export         │         │
│  │ • Extensible roles     │  │ • Compliance evidence  │         │
│  └────────────────────────┘  └────────────────────────┘         │
├──────────────────────────────────────────────────────────────────┤
│  TRACEABILITY PREVIEW — embedded matrix or link to live matrix   │
├──────────────────────────────────────────────────────────────────┤
│  QUICK START — npm install, configure, annotate, build           │
├──────────────────────────────────────────────────────────────────┤
│  BY THE NUMBERS — tests, requirements, relationships, errors     │
├──────────────────────────────────────────────────────────────────┤
│  FOOTER — MIT License, GitHub, npm, Docs                         │
└──────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

- **[Tailwind CDN] Page loads with unstyled content flash**: The CDN script loads asynchronously. Mitigation: Add a brief inline style for the body to prevent FOUC (`<body style="visibility: hidden" onload="...">` or similar), or accept the minor flash given the low-traffic nature of the page.
- **[URL shift] Antora docs move from root to /docs/**: Existing links to the old URL break. Mitigation: The current URL structure (`tracer/0.7.0/`) isn't widely linked externally yet (project is pre-1.0). The root `index.html` redirect can be repurposed.
- **[Antora site.url] May need updating for production**: The playbook currently has `site.url: http://localhost:8080`. GitHub Pages URL should be set correctly. Mitigation: Update to the actual GitHub Pages URL; Antora uses this for canonical links.
- **[Matrix embedding] Iframe or link to live matrix may break**: The matrix paths could change between versions. Mitigation: Link to the versioned matrix rather than embedding, or use a stable redirect path.

## Future Ideas

### AI-Assisted Authoring Section

A section describing how AI tools can generate AsciiDoc with `[item]` macros from natural language requirements. This would position antora-tracer as part of an AI-assisted compliance workflow, making it more approachable for requirements engineers who aren't comfortable with markup. Deferred because we don't yet ship AI skills/agents that support this — it would be vaporware today.

When ready, the section would live between Features and Traceability Preview, with a flow diagram: Natural Language → AI Tools → `[item]` macros → traceability.
