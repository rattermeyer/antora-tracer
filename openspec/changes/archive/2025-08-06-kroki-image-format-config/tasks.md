## 1. Add config option

- [x] 1.1 Add `krokiImageFormat?: "svg" | "png"` to `AntoraTraceabilityConfig` interface
- [x] 1.2 Add `krokiImageFormat: "svg"` to `DEFAULT_CONFIG`
- [x] 1.3 Update `krokiUrl` to read `this.config.krokiImageFormat` instead of hardcoded default

## 2. Update playbooks

- [x] 2.1 Add `krokiImageFormat: png` to `antora-playbook-pdf.yml` extension config

## 3. Verify

- [x] 3.1 Run `npm run build` and `npm test` — 249 tests pass
- [x] 3.2 Build HTML site: verify graph URLs still use SVG
- [x] 3.3 Build PDF site: verify graph URLs use PNG
