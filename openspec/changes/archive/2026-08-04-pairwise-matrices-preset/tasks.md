## 1. Update requirements-engineering preset

- [x] 1.1 Replace the `matrices` section in `src/presets/requirements-engineering.yml` with the three pairwise matrix definitions
- [x] 1.2 Update the preset's `documentation.description` section to describe the new pairwise matrix structure instead of the old wide matrices

## 2. Update example site config

- [x] 2.1 Rename `usecase-requirements` to `usecases-to-requirements` in `examples/traceability.yml` for naming consistency
- [x] 2.2 Verify the example site config still extends `requirements-engineering` correctly after the preset change

## 3. Verification

- [x] 3.1 Run `node examples/run-example.js` and verify the correct pairwise matrix files are generated
- [x] 3.2 Run `npx antora antora-playbook.yml` and verify traceability matrices are generated without errors
- [x] 3.3 Run `npm test` and confirm all tests pass (no code changes needed)
- [x] 3.4 Run `npm run lint` and confirm no new warnings
