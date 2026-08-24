# release-consistency

## Purpose

A release-consistency check validates that package.json, git tags, maintenance branches, the CI playbook refs, and the changelog agree, so version drift fails loudly instead of silently.

## Requirements

### Requirement: Release consistency is checkable
The project SHALL provide a script that verifies the release invariants across `package.json`, git tags, maintenance branches, playbook content-source refs, and the changelog, and SHALL exit non-zero on any mismatch.

#### Scenario: check passes on a consistent release
- **WHEN** `package.json` is `0.20.0`, tag `v0.20.0` exists, branch `v0.20.x` exists, the playbook references `v0.20.x`, and the changelog has a `[0.20.0]` entry
- **THEN** the script SHALL exit 0

#### Scenario: check fails on a version mismatch
- **WHEN** `package.json` is `0.20.0` but no tag `v0.20.0` exists
- **THEN** the script SHALL exit non-zero and report the missing tag

### Requirement: Version is consistent across sources
The script SHALL require that the `package.json` version, the git tag name, and the changelog entry version all refer to the same `major.minor.patch` release.

#### Scenario: tag does not match package version
- **WHEN** `package.json` is `0.20.0` and the tag is `v0.21.0`
- **THEN** the script SHALL report a mismatch between the tag and `package.json`

### Requirement: Maintenance branch follows the tag
The script SHALL require a maintenance branch named `v<major>.<minor>.x` for the released `v<major>.<minor>.0` tag.

#### Scenario: maintenance branch missing
- **WHEN** tag `v0.20.0` exists but no branch `v0.20.x` exists
- **THEN** the script SHALL report the missing maintenance branch

### Requirement: Playbook refs exist in the repository
The script SHALL verify that every branch and tag referenced by the CI playbook content sources exists in the repository.

#### Scenario: playbook references a missing ref
- **WHEN** the playbook references branch `v0.20.x` but the repository lacks it
- **THEN** the script SHALL report the missing ref
