## ADDED Requirements

### Requirement: main is a named prerelease
The `main` branch's component version descriptor SHALL declare `version: main` with `prerelease: true`, so `main` serves the development docs at `/main/` and is excluded from "latest stable" selection.

#### Scenario: main is excluded from latest stable
- **WHEN** the site has `main` (a prerelease) and a stable release `0.20`
- **THEN** the latest stable version SHALL be `0.20`, not `main`

#### Scenario: main docs live at the main segment
- **WHEN** a page from `main` is published
- **THEN** its URL SHALL use the `main` version segment

### Requirement: Release versions derive from the git refname
A maintenance branch SHALL derive its component version from the git refname using a projection in the component version descriptor, so no hand-maintained literal version exists on release refs.

#### Scenario: maintenance branch derives a semantic version
- **WHEN** a branch named `v0.20.x` is built
- **THEN** the component version SHALL be the semantic identifier `0.20`

### Requirement: Version selector shows main plus released versions
The component version selector SHALL list the `main` prerelease and the released semantic versions in descending order.

#### Scenario: selector ordering
- **WHEN** the site has `main` (a prerelease) and released versions `0.20` and `0.19`
- **THEN** the selector SHALL show `main`, then `0.20` and `0.19`, with `0.20` before `0.19`

### Requirement: Stable URL points at the latest release
The playbook SHALL set `latest_version_segment: stable`, so the latest stable (non-prerelease) release is served at `/stable/`.

#### Scenario: stable segment points at the latest release
- **WHEN** the site has releases `0.20` and `0.21`
- **THEN** `/stable/` SHALL serve `0.21`, and `/0.20/` SHALL serve `0.20`

### Requirement: Extension handles unversioned components
The extension SHALL treat an unversioned component version (an empty string) as a valid version rather than substituting a placeholder, so generated attachments resolve via xref from unversioned content.

#### Scenario: attachments resolve in unversioned content
- **WHEN** the site builds `main` as an unversioned component
- **THEN** generated matrices and the overview SHALL resolve via `xref:attachment$traceability/...` from unversioned pages
