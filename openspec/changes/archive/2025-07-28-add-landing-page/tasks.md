## 1. Directory and CI Setup

- [x] 1.1 Create `landing/` directory at repo root with `css/` subdirectory
- [x] 1.2 Update `antora-playbook.yml`: change `output.dir` to `./public/docs` and update `site.url` for GitHub Pages
- [x] 1.3 Update `.github/workflows/pages.yml`: add step after Antora build to copy `landing/*` to `public/`

## 2. Landing Page Structure

- [x] 2.1 Create `landing/css/landing.css` with custom styles (fonts, subtle animations, section spacing beyond Tailwind defaults)
- [x] 2.2 Create `landing/index.html` shell with Tailwind CDN, meta tags, favicon, and semantic section structure
- [x] 2.3 Implement hero section: project name, one-line description, badges (MIT, TypeScript, ESM), CTA buttons (Get Started, View Docs, GitHub)

## 3. Content Sections

- [x] 3.1 Implement "How It Works" section with the architecture flow diagram (`.adoc → Extension → Matrices/Coverage/Neo4j`) styled as a visual flow
- [x] 3.2 Implement two-column features section: left column for Developers & Architects, right column for REs & Project Managers
- [x] 3.3 Implement AI-assisted workflow section: natural language → AI → `[item]` macros → traceability
- [x] 3.4 Implement traceability visualization preview section: link to live matrices in the deployed docs at `/docs/`
- [x] 3.5 Implement "Quick Start" section with npm install, configure, annotate, build steps
- [x] 3.6 Implement "By the Numbers" section with stats (194 tests, 36 reqs, 82 relationships, 0 errors)
- [x] 3.7 Implement sticky nav bar and footer with links to Docs, GitHub, npm, License

## 4. Validation

- [x] 4.1 Run `npx antora antora-playbook.yml` and verify output goes to `public/docs/`
- [x] 4.2 Run `cp -r landing/* public/` and verify `public/index.html` exists alongside `public/docs/`
- [x] 4.3 Open `public/index.html` in browser and verify all sections render, links work, Tailwind styles apply
- [x] 4.4 Verify `/docs/` links navigate correctly to the Antora documentation
