---
name: publish
description: Release antora-tracer — mechanically bump the npm version AND the Antora component version, set the docs build to main + the release tag, tag, publish to npm. Use when the user says "publish", "release", "ship", "npm publish", "cut a release", "bump version", "new version", or "tag the release".
---

# Publish a Release

Releasing `antora-tracer` touches **four files**, a git tag, and a docs build
ref. `npm publish` alone covers none of the version plumbing correctly. This
skill makes the agent perform the mechanical edits — do not just tell the user
to do them.

## The mechanic part (agent must do this, not remind about it)

For a release `0.19.0`, edit these three files with the exact values. The agent
uses the `edit` tool on each:

| File | Change |
|------|--------|
| `package.json` | `"version": "0.19.0"` |
| `examples/tracer/antora.yml` | `version: 0.19`, and remove `prerelease: '-wip'` for the stable release |
| `antora-playbook-ci.yml` | content sources → `branches: ['main']`, `tags: ['v0.19.0']` |
| `CHANGELOG.md` | new `## [0.19.0] — <date>` entry at the top (see below) |

**Version mapping (no exceptions):**

| Where | Format | Example for 0.19.0 |
|-------|--------|--------------------|
| `package.json` `version` | `major.minor.patch` | `0.19.0` |
| `examples/tracer/antora.yml` `version` | `major.minor` (drop patch) | `0.19` |
| git tag | `v` + npm version | `v0.19.0` |
| `blog/antora.yml` `version` | independent — leave at `0.1` unless blog changed | — |

**Why this is explicit:** `examples/tracer/antora.yml` has been stuck at
`version: 0.13` + `prerelease: '-wip'` since release `v0.16.0`, while npm
reached `0.19.0`. The component version never got bumped because `npm version`
only touches `package.json`. Never skip the antora.yml edit.

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

The Antora content source builds **`main` AND the release tag** — both, always:

```yaml
# antora-playbook-ci.yml
content:
  sources:
    - url: https://github.com/rattermeyer/antora-tracer.git
      start_path: examples/tracer
      branches: ['main']
      tags: ['v0.19.0']
    - url: https://github.com/rattermeyer/antora-tracer.git
      start_path: blog
      branches: ['main']
```

- `main` → the WIP/next prerelease (keeps `-wip`).
- `v0.19.0` → the stable release docs (no prerelease), shown as `latest`.

The local playbook (`antora-playbook.yml`) uses `branches: HEAD` and is
preview-only; do not edit its refs.

## Release sequence

Run from a clean tree on `main`. Order matters: the antora.yml change must be
**in the tagged commit**, otherwise the tag points at a commit whose docs still
carry the old version.

```bash
# 1. Pre-flight — everything green
npm run build && npm test && npm run lint
git status --short          # must be empty
```

2. Agent edits the four files above (mechanically, exact values).
3. Commit the version files and changelog together, then tag:

```bash
# 3. Single commit: package.json + antora.yml + CHANGELOG.md (playbook can join or follow)
git add package.json package-lock.json examples/tracer/antora.yml CHANGELOG.md antora-playbook-ci.yml
git commit -m "chore(release): v0.19.0"

# 4. Tag on that commit (must NOT precede the antora.yml edit)
git tag v0.19.0
git push origin main v0.19.0

# 5. Publish to npm — build first, lib/src is the shipped artifact
npm run build
npm publish
```

**Why not plain `npm version`:** it commits and tags immediately, which would
tag a commit *before* the antora.yml edit if run out of order. Edit all files
first, commit, then tag.

## Post-release: move main to the next WIP version

After the tag, `main` must build the next prerelease so its docs are marked
not-yet-released:

```bash
# edit examples/tracer/antora.yml: version: 0.20, restore "prerelease: '-wip'"
git commit -am "chore(release): start 0.20-wip on main"
git push origin main
```

## Guardrails

- Never `npm publish` before `npm run build` — the package ships compiled
  `lib/src`; stale output would be published.
- Never tag before the antora.yml version matches the release.
- The CI playbook always lists the release tag under `tags`, never under `branches`: `branches: ['main']` and `tags: ['<current release tag>']`. A tag name in `branches` is silently ignored.
- Don't bump `blog/antora.yml` unless blog content changed; it's versioned
  independently.
- If the version selector still shows the old version after deploy, the tag is
  missing from `antora-playbook-ci.yml` content sources.
