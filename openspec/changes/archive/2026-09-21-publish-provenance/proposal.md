## Why

The packages are published from a developer laptop with no verifiable link between the published tarball and the source commit that produced it. A tampered artifact or a compromised publish step is undetectable. npm provenance and signed SBOMs make every release verifiable — a consumer can prove which commit built a package, and that its SBOM is authentic.

## What Changes

- `npm publish --provenance` for both packages, publishing from GitHub Actions (SLSA Level 3 provenance).
- A `release.yml` workflow that builds, tests, publishes, generates CycloneDX SBOMs, and signs them with cosign (keyless).
- `"provenance": true` in the `publishConfig` of both `package.json` files.
- A cosign-signed SBOM artifact attached to each release.
- cosign signing of Docker images is **out of scope** — no container publish pipeline exists yet.

## Capabilities

### New Capabilities

- `publish-provenance`: verifiable releases — SLSA provenance for npm packages and cosign-signed SBOMs.

### Modified Capabilities

_None._

## Impact

- **CI**: new `release.yml` workflow; `id-token: write` permission for keyless signing.
- **Packages**: `publishConfig.provenance: true` in both `package.json` files.
- **Dependencies**: CI-only — `@cyclonedx/cyclonedx-npm` and `sigstore/cosign-installer`. No runtime deps.
- **Release process**: publishing moves from manual `npm publish` to tag-triggered CI.
- **Docs**: update `contribute.adoc` "Build and release" for the CI flow, and add REQ items for the new capability to the example site (following the convention that every spec maps to REQ items, as `release-consistency` and `ci-pdf-deploy` do).
