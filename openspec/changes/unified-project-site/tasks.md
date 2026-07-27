# Tasks: Unified Project Site

## 1. Refactor Guides into Example Site

- [ ] 1.1 Move `docs/user-guide.adoc` to `examples/modules/ROOT/pages/user-guide.adoc`
- [ ] 1.2 Move `docs/developer-guide.adoc` to `examples/modules/ROOT/pages/developer-guide.adoc`
- [ ] 1.3 Update `examples/modules/ROOT/nav.adoc` to include user guide and developer guide
- [ ] 1.4 Update `examples/modules/ROOT/pages/index.adoc` to link to user guide and developer guide
- [ ] 1.5 Verify Antora build succeeds with the new pages

## 2. Redirect Stubs in docs/

_Not needed — GitHub Pages deploys `public/`, not the `docs/` source directory._

## 3. GitHub Pages Deployment

- [ ] 3.1 Add `.github/workflows/pages.yml` with steps: checkout, setup-node, npm ci, npm run build, antora build, upload-pages-artifact, deploy-pages
- [ ] 3.2 Pin UI bundle to a specific commit hash in `antora-playbook.yml` for CI reliability (instead of `HEAD`)
- [ ] 3.3 Configure GitHub Pages source to "GitHub Actions" in repository settings
- [ ] 3.4 Verify the deployed site is accessible at `<username>.github.io/<repo>/`

## 4. Package Metadata

- [ ] 4.1 Add `repository` field to `package.json`
- [ ] 4.2 Add `bugs` field to `package.json`
- [ ] 4.3 Add `homepage` field to `package.json` (points to GitHub Pages URL)
- [ ] 4.4 Add `author` with name and email to `package.json`

## 5. Verification

- [ ] 5.1 Run `npm run build && npm test` — all tests pass
- [ ] 5.2 Run `npx antora antora-playbook.yml` — zero warnings, matrices generated
- [ ] 5.3 Verify navigation includes all pages: Overview, User Guide, Developer Guide, Requirements, Architecture, Test Plan, Traceability, Sphinx Comparison
- [ ] 5.4 Verify clickable links work in the deployed/rendered output

## 6. Sphinx Needs Comparison

- [ ] 6.1 Create `examples/modules/ROOT/pages/sphinx-comparison.adoc` mapping Sphinx Needs concepts to antora-tracer equivalents
- [ ] 6.2 Include directive mapping table: `:need:` → `[item, role=...]`, link types, config formats
- [ ] 6.3 Include feature comparison: roles, relations, matrices, export, presets
- [ ] 6.4 Add to navigation via `nav.adoc`
