## ADDED Requirements

### Requirement: main is unversioned
The `main` branch's component version descriptor SHALL declare `version: ~`, making the component version unversioned so Antora always treats it as the latest version.

#### Scenario: main docs are the latest version
- **WHEN** the site is built with `main` declared unversioned
- **THEN** Antora SHALL treat the `main` content as the latest component version

#### Scenario: main docs have no version segment in URLs
- **WHEN** a page from `main` is published
- **THEN** its URL SHALL omit the version segment (the page lives at the component root)

### Requirement: Release versions derive from the git refname
A release branch or tag SHALL derive its component version from the git refname using a projection in the component version descriptor, so no hand-maintained literal version exists on release refs.

#### Scenario: maintenance branch derives a semantic version
- **WHEN** a branch named `v0.20.x` is built
- **THEN** the component version SHALL be the semantic identifier `0.20`

#### Scenario: release tag derives the same semantic version
- **WHEN** a tag named `v0.20.0` is built
- **THEN** the component version SHALL be the semantic identifier `0.20`

### Requirement: Version selector shows main plus released versions
The component version selector SHALL list the unversioned `main` content first, followed by released semantic versions in descending order.

#### Scenario: selector ordering
- **WHEN** the site has unversioned `main` and released versions `0.20` and `0.19`
- **THEN** the selector SHALL show `main` before `0.20` and `0.19`, with `0.20` before `0.19`

### Requirement: Extension handles unversioned components
The extension SHALL treat an unversioned component version (an empty string) as a valid version rather than substituting a placeholder, so generated attachments resolve via xref from unversioned content.

#### Scenario: attachments resolve in unversioned content
- **WHEN** the site builds `main` as an unversioned component
- **THEN** generated matrices and the overview SHALL resolve via `xref:attachment$traceability/...` from unversioned pages
