## 1. Provenance config

- [x] 1.1 Add `"provenance": true` to `publishConfig` in both `package.json` files and verify `npm pkg get publishConfig` shows `access` and `provenance` for each

## 2. Release workflow

- [x] 2.1 Add `.github/workflows/release.yml` (triggered on `v*` tags and `workflow_dispatch`, `id-token: write`) that builds, tests, and publishes both packages, and verify the YAML parses and the publish steps use `--provenance`

## 3. SBOM and cosign

- [x] 3.1 Add `@cyclonedx/cyclonedx-npm --omit dev` SBOM generation for both packages, sign each with `cosign sign-blob` (keyless), and attach the signed SBOM to the release, and verify by generating and signing the two SBOMs locally

## 4. Docs

- [x] 4.1 Update `contribute.adoc` "Build and release" to the tag-triggered CI flow and document how consumers verify provenance (`npm attestation verify`) and SBOMs (`cosign verify-blob`), and verify the example site builds cleanly
- [x] 4.2 Add REQ items for the four `publish-provenance` requirements to the requirements index and regenerate the Neo4j export, and verify the traceability build has no new errors
