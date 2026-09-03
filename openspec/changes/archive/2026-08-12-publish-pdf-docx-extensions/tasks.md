## 1. Move extension files into src/

- [x] 1.1 Move `antora-pdf-extension.cjs` from project root to `src/antora-pdf-extension.cjs`
- [x] 1.2 Move `antora-docx-extension.cjs` from project root to `src/antora-docx-extension.cjs`
- [x] 1.3 Move `antora-docx-converter.cjs` from project root to `src/antora-docx-converter.cjs`; fix internal require path to `./antora-docx-converter.cjs` (same dir, still works)

## 2. Move example-site config to examples/

- [x] 2.1 Move `adoc-to-docx` script from project root to `examples/adoc-to-docx`; preserve executable bit
- [x] 2.2 Move all `antora-assembler-pdf*.yml` (5 files) from project root to `examples/`
- [x] 2.3 Move all `antora-assembler-docx*.yml` (5 files) from project root to `examples/`
- [x] 2.4 Update `command:` in each `examples/antora-assembler-docx*.yml` from `./adoc-to-docx` to `./examples/adoc-to-docx`

## 3. Update build pipeline

- [x] 3.1 Update `scripts/build.js` to copy `src/*.cjs` to `lib/src/` alongside templates and presets

## 4. Update package.json

- [x] 4.1 Add `lib/src/antora-pdf-extension.cjs`, `lib/src/antora-docx-extension.cjs`, `lib/src/antora-docx-converter.cjs` to `files` array (or confirm `lib/src` glob covers them)
- [x] 4.2 Add exports: `"./antora-pdf": "./lib/src/antora-pdf-extension.cjs"` and `"./antora-docx": "./lib/src/antora-docx-extension.cjs"`
- [x] 4.3 Move `@antora/assembler` and `@antora/pdf-extension` from `devDependencies` to `peerDependencies`
- [x] 4.4 Add `peerDependenciesMeta` marking both as `optional: true`

## 5. Update playbook files

- [x] 5.1 Update `antora-playbook-pdf.yml`: change `require: ./antora-pdf-extension.cjs` to `require: @antora-tracer/core/antora-pdf`
- [x] 5.2 Update `antora-playbook-pdf.yml`: change `require: ./antora-docx-extension.cjs` to `require: @antora-tracer/core/antora-docx`
- [x] 5.3 Update assembler config references in `antora-playbook-pdf.yml` from root paths to `./examples/antora-assembler-*.yml`

## 6. Update documentation

- [x] 6.1 Update `how-to/generate-docx.adoc`: show `require: @antora-tracer/core/antora-docx` and `npm install @antora/assembler @antora/pdf-extension`
- [x] 6.2 Update `how-to/contribute.adoc` if it references the old local paths

## 7. Verify

- [x] 7.1 Run `npm run build` — confirm `.cjs` files appear in `lib/src/`
- [x] 7.2 Run `npm pack --dry-run` — confirm all three `.cjs` files are in the published file set
- [x] 7.3 Run `npm test` — all tests pass
- [ ] 7.4 Run `npx antora antora-playbook-pdf.yml` — PDF and DOCX output produced without errors
- [x] 7.5 Confirm project root contains no `antora-*.cjs`, `antora-assembler-*.yml`, or `adoc-to-docx` files
