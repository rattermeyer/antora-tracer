# Publish Provenance

## Purpose

Make every published release verifiable: each npm package carries SLSA Level 3 provenance, and each release ships a cosign-signed SBOM.

## Requirements

### Requirement: Published packages carry provenance
Each published package SHALL carry a SLSA Level 3 provenance attestation linking the tarball to the source commit, workflow, and date that produced it.

#### Scenario: Release stages with provenance
- **WHEN** a version tag triggers the release workflow
- **THEN** both packages are staged with a provenance attestation

#### Scenario: Consumer verifies provenance
- **WHEN** a consumer runs `npm attestation verify <package>@<version>`
- **THEN** the attestation verifies successfully

### Requirement: Releases are staged from CI and approved by a maintainer
Package releases SHALL be staged from the GitHub Actions release workflow, and approved by a maintainer with two-factor authentication.

#### Scenario: Tag-triggered staging
- **WHEN** a `v*` tag is pushed
- **THEN** the release workflow stages the packages

#### Scenario: Maintainer approves
- **WHEN** a maintainer approves a staged version with two-factor authentication
- **THEN** the package is published to the registry

### Requirement: Releases produce a signed SBOM
Each release SHALL produce a CycloneDX SBOM for each package, signed with cosign using the workflow's keyless identity.

#### Scenario: SBOM artifact attached
- **WHEN** the release workflow runs
- **THEN** a signed SBOM for each package is attached to the release

#### Scenario: SBOM verifies
- **WHEN** a consumer runs `cosign verify-blob` on a released SBOM
- **THEN** verification succeeds

### Requirement: No long-lived signing keys
Signing SHALL use Sigstore keyless identity (GitHub Actions OIDC), with no long-lived signing key stored in the repository or its secrets.

#### Scenario: Keyless signing
- **WHEN** the release workflow signs an artifact
- **THEN** signing uses a short-lived identity, not a stored key
