## Why

The example site's Antora component version is hand-maintained in `antora.yml` and has drifted from the actual release — it sat at `0.13` while npm reached `0.19.0`. Building a release tag also failed because a tag is immutable and cannot receive the doc fixes the Vale lint requires. Deriving the version from the git refname removes the hand-maintained number, and a consistency-check script catches the remaining release invariants.

## What Changes

- `examples/tracer/antora.yml` version becomes derived from the git refname instead of a literal string: `main` is unversioned (`version: ~`, always treated as "latest" by Antora), and release branches/tags use a refname projection (`v0.20.x` → `0.20`). **BREAKING**: the URL scheme changes — `main`'s docs move to the component root (no version segment) and released docs move to their own version segment.
- Add a release-consistency check script that validates the remaining hand-maintained invariants: `package.json` version ↔ git tag name ↔ maintenance branch name ↔ playbook content-source refs ↔ changelog entry.
- Update `antora-playbook-ci.yml` content sources to build `main` plus the release maintenance branch.
- Update the `publish` skill to teach the new versioning model and the consistency check.
- Document the versioning model in the explanation/reference docs.

## Capabilities

### New Capabilities

- `component-versioning`: The Antora component version is derived from the git refname — unversioned `main`, refname projection for release branches/tags — instead of a hand-maintained literal.
- `release-consistency`: A script (runnable locally and in CI) verifies that package.json, git tags, maintenance branches, playbook refs, and the changelog agree on the release version.

### Modified Capabilities

<!-- none -->

## Impact

- **Files**: `examples/tracer/antora.yml`, `antora-playbook-ci.yml`, `antora-playbook.yml`, `src/antora-extension.ts`, new `scripts/release-check.*`, `.pi/skills/publish/SKILL.md`, explanation/reference docs.
- **Behavior**: Published URL scheme changes (main at component root, releases under their own version segment); the `latest`/`unstable` symbolic-version and prerelease demo is removed or relocated.
- **CI**: A release-consistency check becomes part of the build so drift fails loudly instead of silently.
