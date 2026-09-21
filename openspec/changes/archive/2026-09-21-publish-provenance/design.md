## Context

The repo publishes two npm packages — `@antora-tracer/core` (root) and `@antora-tracer/id-server` (`id-server/`) — manually via `npm publish` from a developer machine (see `contribute.adoc`, "Build and release"). The only workflows are `ci.yml` and `pages.yml`; there is no release/publish workflow. Both packages are public with `publishConfig.access: public`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- Every published package carries a SLSA Level 3 provenance attestation.
- Every release produces a cosign-signed CycloneDX SBOM per package.
- No long-lived signing keys (keyless via GitHub Actions OIDC).

**Non-Goals:**

- Publishing Docker images to a registry, and thus cosign-signing them — no container publish pipeline exists yet.
- Signing the Antora docs-site artifacts.
- Verifying provenance/SBOMs in CI (that is a consumer action, not a build gate).

## Decisions

### Publish from a tag-triggered GitHub Actions workflow

A `release.yml` triggered on `v*` tags (plus `workflow_dispatch` for retries) runs the publish. Provenance requires publishing from CI, so the manual `npm publish` step is retired. `permissions: id-token: write` grants the keyless identity.

### npm provenance via `publishConfig.provenance`

Set `"publishConfig": { "access": "public", "provenance": true }` in both `package.json` files so every publish is attested without a per-command flag. Prerequisites — npm ≥ 9.5 and a public repo — are already satisfied.

### Keyless cosign, not a managed keypair

`cosign` signs via the workflow's OIDC identity; no key secret to store or rotate. `sigstore/cosign-installer` provides the binary, `cosign sign-blob` signs the SBOM files, and the signature bundle is attached to the release.

### SBOM via `@cyclonedx/cyclonedx-npm`, dev omitted

Generate a production-only CycloneDX SBOM per package (`--omit dev`), matching what ships. Two invocations (separate lockfiles), not a workspace. Chosen over `npm sbom` because `npm sbom --omit dev` dropped 4 of the 6 core prod deps in testing.

### No image signing yet

cosign image signing is deferred until a container publish pipeline (e.g. GHCR) exists — images are currently built locally only.

## Risks / Trade-offs

- [Provenance ties publish to CI; local publish no longer attested] → retire `npm publish` from the docs; document the tag-triggered path.
- [Two packages need two build/publish/SBOM steps] → explicit per-package steps in the workflow.
- [Keyless signing is identity-bound, not key-bound] → acceptable; the GitHub repo identity is the root of trust.

## Migration Plan

Add the workflow and `publishConfig.provenance`, then cut over by tagging a release. No data migration. Rollback = revert the workflow and publish manually (unattested).

## Open Questions

- Whether to publish Docker images to a registry (GHCR) and then cosign-sign them — deferred pending a decision on image distribution.
