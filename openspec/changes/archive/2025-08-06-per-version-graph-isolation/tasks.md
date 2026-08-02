## 1. Implement version grouping

- [x] 1.1 Group `adocFiles` and `adocPartials` by `file.src?.version` in `registerContentClassifier`
- [x] 1.2 Move macro expansion and link substitution inside the per-version loop
- [x] 1.3 Call `this.traceability.graph.clear()` at the start of each version iteration

## 2. Verify

- [x] 2.1 Run `npm run build` to compile
- [x] 2.2 Run `npm test` — 249 tests should pass
- [x] 2.3 Build example site locally: `npx antora generate antora-playbook.yml`
- [x] 2.4 Build multi-version CI site: `npx antora generate antora-playbook-ci.yml` (after `rm -rf .cache`)
- [x] 2.5 Verify no "target of xref not found" errors in CI build output
