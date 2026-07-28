## Why

The GitHub Pages deployment currently serves the Antora documentation site directly at the root URL — visitors land on a redirect page and are immediately dropped into the docs. There is no "front door" that introduces the project, explains its value, and guides different audiences to the right entry point. A landing page bridges the gap between two key audiences — developers/architects who live in docs-as-code, and requirements engineers/PMs who need traceability but are less comfortable with text editors.

## What Changes

- Add a single-page landing page (`landing/index.html`) styled with Tailwind CSS CDN (no build step)
- Restructure GitHub Pages deployment: landing page at root (`/`), Antora docs at `/docs/`
- Update `antora-playbook.yml` to output to `./public/docs` instead of `./public`
- Update `.github/workflows/pages.yml` to copy landing page assets into `public/` before deployment
- The landing page presents project features for both personas, embeds traceability visualization (linking to the live matrices), describes the AI-assisted workflow, and links into the Antora docs

## Capabilities

### New Capabilities

- `landing-page`: A static HTML landing page hosted at the GitHub Pages root that introduces antora-tracer to both developer/architect and requirements engineer/PM audiences with feature highlights, traceability visualization preview, AI-assisted workflow description, and navigation to the full documentation site

### Modified Capabilities

None. No existing spec-level behavior changes.

## Impact

- `antora-playbook.yml`: `output.dir` changed from `./public` to `./public/docs`; `site.url` updated
- `.github/workflows/pages.yml`: new build step to copy `landing/*` → `public/`
- New directory `landing/` with `index.html`, `css/landing.css`, and any static assets
- Existing redirect `public/index.html` replaced by landing page (build artifact)
- No changes to Antora content, source code, or extension behavior
