# Tasks: Unified Project Site

## 1. Refactor Guides into Example Site

- [ ] 1.1 Move `docs/user-guide.adoc` to `examples/modules/ROOT/pages/user-guide.adoc`
- [ ] 1.2 Move `docs/developer-guide.adoc` to `examples/modules/ROOT/pages/developer-guide.adoc`
- [ ] 1.3 Update `examples/modules/ROOT/nav.adoc` to include user guide and developer guide
- [ ] 1.4 Update `examples/modules/ROOT/pages/index.adoc` to link to user guide and developer guide
- [ ] 1.5 Verify Antora build succeeds with the new pages

## 2. Redirect Stubs in docs/

- [ ] 2.1 Replace `docs/user-guide.adoc` with a stub pointing to the deployed site
- [ ] 2.2 Replace `docs/developer-guide.adoc` with a stub pointing to the deployed site

## 3. GitHub Pages Deployment

- [ ] 3.1 Add `.github/workflows/pages.yml` to deploy `public/` to GitHub Pages on push to main
- [ ] 3.2 Configure the workflow to build the Antora site with the extension and UI bundle
- [ ] 3.3 Verify the deployed site is accessible and matrices render correctly

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
