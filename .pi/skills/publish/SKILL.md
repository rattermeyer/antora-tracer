---
name: publish
description: Release antora-tracer — bump the npm version, tag, create a maintenance branch, publish to npm, and verify release consistency. The Antora component version is derived from the git refname, not hand-maintained. Use when the user says "publish", "release", "ship", "npm publish", "cut a release", "bump version", "new version", or "tag the release".
---

# Publish a Release

The Antora component version is **derived from the git refname**, so there is
no hand-maintained version to drift. `main` is a named prerelease
(`version: main` + `prerelease: true`) served at `/main/`. A maintenance branch
(`vX.Y.x`) carries a refname projection that derives its version (e.g. `v0.20.x`
→ `0.20`), and `latest_version_segment: stable` points `/stable/` at the newest
release. A release consistency check validates the remaining hand-maintained
pieces.

## The mechanic part (agent must do this, not remind about it)

For a release `0.19.0`, edit these files with the exact values. The agent uses
the `edit` tool on each:

| File | Change |
|------|--------|
| `package.json` | `"version": "0.19.0"` |
| `CHANGELOG.md` | new `## [0.19.0] — <date>` entry at the top (see below) |
| `antora-playbook-ci.yml` | content sources → `branches: ['main', 'v0.19.x']` |
| `examples/tracer/antora.yml` | leave `version: main` + `prerelease: true` on `main` (unchanged) |

**Version mapping (no exceptions):**

| Where | Format | Example for 0.19.0 |
|-------|--------|--------------------|
| `package.json` `version` | `major.minor.patch` | `0.19.0` |
| git tag | `v` + npm version | `v0.19.0` |
| maintenance branch | `v` + `major.minor` + `.x` | `v0.19.x` |
| component version | derived from refname via projection | `0.19` |
| `blog/antora.yml` `version` | independent — leave at `0.1` unless blog changed | — |

The `antora.yml` component version is **not** hand-maintained anymore. The
previous model drifted (stuck at `0.13` while npm reached `0.19.0`). With
`version: main` + `prerelease: true` on `main` and a projection on each
maintenance branch, the version can never disagree with the ref it came from.

## Changelog

Write or extend `CHANGELOG.md` (Keep a Changelog style) as part of the
release. This is mechanical too — the agent derives the entries, not the user.

1. List changes since the previous tag:

   ```bash
   git log v0.18.0..HEAD --oneline
   ```

2. Group each conventional-commit message into one of the changelog sections
   and write a plain sentence per bullet (drop the type/scope prefix):

   | Commit type | Section |
   |-------------|---------|
   | `feat` | `### Added` |
   | `fix` | `### Fixed` |
   | behavior change / `refactor` | `### Changed` |
   | removal | `### Removed` |

   `chore`, `docs`, `test`, `ci`, and `style` commits are usually omitted from
   the changelog unless user-visible.

3. Format — new entry at the top, date as `YYYY-MM-DD`:

   ```markdown
   ## [0.19.0] — 2026-08-19

   ### Added
   - ...

   ### Changed
   - ...

   ### Fixed
   - ...
   ```

## What the docs build

The Antora content source builds **`main` AND the maintenance branch** — both,
always:

```yaml
# antora-playbook-ci.yml
content:
  sources:
    - url: https://github.com/rattermeyer/antora-tracer.git
      start_path: examples/tracer
      branches: ['main', 'v0.19.x']
    - url: https://github.com/rattermeyer/antora-tracer.git
      start_path: blog
      branches: ['main']
```

- `main` → named prerelease (`version: main` + `prerelease: true`), served at `/main/`.
- `v0.19.x` → derived `0.19` via the projection; as the latest stable it is served at `/stable/`.

The playbook's `urls` sets `latest_version_segment: stable`, so `/stable/` points
at the newest stable release and moves automatically when a newer one ships.

The maintenance branch's `antora.yml` carries the projection:

```yaml
version:
  v(?<v>+({0..9}).+({0..9})).x: $<v>
```

Build the branch, not the tag: a tag is immutable and cannot receive doc fixes
that the vale lint requires. Create `v0.19.x` at the tag and backport fixes onto
it.

The local playbook (`antora-playbook.yml`) uses `branches: HEAD` and is
preview-only; do not edit its refs.

## npm trusted publishing

Releases publish from GitHub Actions with npm OIDC trusted publishing; never run `npm publish` locally or require a long-lived `NPM_TOKEN`.
Before the first release, configure a separate npm Trusted Publisher on each package (`@antora-tracer/core` and `@antora-tracer/id-server`): GitHub Actions, owner `rattermeyer`, repository `antora-tracer`, workflow filename `release.yml`, with direct `npm publish` allowed.
Do not set an npm environment name unless the workflow uses a GitHub deployment environment.
The release workflow requires `id-token: write` and npm CLI 11.5.1 or later on Node.js 22.14 or later; both are configured in `.github/workflows/release.yml`.
Use `actions/setup-node` with the npm registry URL but `package-manager-cache: false`; its `.npmrc` selects the OIDC registry, while cache setup can interfere with trusted publishing.

## Release sequence

Run from a clean tree on `main`; create the maintenance branch at the release commit.

```bash
# 1. Pre-flight — everything green
pnpm run build && pnpm test && pnpm run lint
git status --short          # must be empty

# 2. Update package.json, CHANGELOG.md, and antora-playbook-ci.yml.
# 3. Commit release metadata.
git add package.json pnpm-lock.yaml CHANGELOG.md antora-playbook-ci.yml
git commit -m "chore(release): v0.19.0"

# 4. Tag and create the maintenance branch at that release commit.
git tag v0.19.0
git branch v0.19.x v0.19.0

# 5. Verify and push; the tag push triggers the GitHub publish workflow.
node scripts/release-check.js
git push origin main v0.19.0 v0.19.x
```

Wait for the `Release` workflow to publish both packages and complete SBOM signing before calling the release complete.
## Guardrails

- Never `npm publish` before `npm run build` — the package ships compiled
  `lib/src`; stale output would be published.
- Never tag before the changelog and playbook edits are committed.
- The stable docs build from a maintenance branch (`vX.Y.x`), never from the
  tag itself — a tag is immutable.
- Run `node scripts/release-check.js` before publish; it fails loudly on a
  version/tag/branch/changelog mismatch.
- Don't bump `blog/antora.yml` unless blog content changed; it's versioned
  independently.
- If the version selector still shows the old version after deploy, the tag is
  missing from `antora-playbook-ci.yml` content sources.
