## Context

The example site's Antora component version is hand-maintained as a literal in `examples/tracer/antora.yml`. This literal has drifted from the real release — it sat at `0.13` while npm reached `0.19.0`. The release process also produced a tag that could not be built because a tag is immutable and the Vale lint (added later, running from `main`'s rules) flags the frozen content.

Antora 3.1 offers native versioning mechanisms (verified in the docs and spike):
- `version: main` with `prerelease: true` marks a named version as a prerelease, which Antora excludes from "latest stable" selection.
- A **refname projection** derives the version from the git refname via a pattern→replacement map (e.g. `v0.20.x` → `0.20`).
- `latest_version_segment` (symbolic version) replaces the latest stable version's URL segment (e.g. `stable`).

## Goals / Non-Goals

**Goals:**
- Remove the hand-maintained `version` literal from `antora.yml` so it cannot drift.
- Keep the multi-version demo (3+ versions are planned for demo purposes).
- Make the remaining release invariants executable — fail loudly, not silently.

**Non-Goals:**
- Not automating the npm release (`npm publish`) or adopting a release tool (release-it etc.).
- Not changing the extension's graph/rendering behavior.

## Decisions

### D1: `main` is a named prerelease (`version: main` + `prerelease: true`)

`main`'s `antora.yml` sets `version: main` with `prerelease: true`, a constant that never changes. As a prerelease, `main` is excluded from "latest stable" selection, so it serves the development docs at `/main/` without stealing the `stable` designation from the newest release.

*Alternatives considered:* `version: ~` (unversioned) → always treated as "latest", which would shadow the stable releases and make `latest_version_segment` a no-op; rejected. A literal prerelease version (`0.21-wip`) → reintroduces the drift; rejected.

### D2: Release branches/tags use a refname projection

```yaml
version:
  v(?<major>\d+)\.(?<minor>\d+)\.x: $<major>.$<minor>
  v(?<major>\d+)\.(?<minor>\d+)\.\d+: $<major>.$<minor>
```

`v0.20.x` and `v0.20.0` both derive `0.20`, a clean semantic identifier that preserves semver sorting and latest-version detection.

*Alternatives considered:* `version: true` → yields `v0.20.x` (named identifier, lexicographic sort, breaks `latest`); rejected.

### D3: A release-consistency script enforces the remaining invariants

After D1+D2, the remaining hand-maintained edges are naming-convention and existence checks: `package.json` version ↔ git tag ↔ maintenance branch ↔ playbook refs ↔ changelog entry. A small script (runnable locally and in CI) verifies these and fails with a clear message.

*Alternatives considered:* relying on the `publish` skill prose → already drifted once; rejected. CI-only check → should also run before commit; rejected.

### D4: A stable URL via `latest_version_segment: stable`

The playbook sets `latest_version_segment: stable`, so the latest stable (non-prerelease) release is served at `/stable/`. The symbolic segment replaces that version's own URL segment. When a newer release is added, `/stable/` moves to it automatically with no playbook change; the previously-latest release reverts to its own version segment.

## Risks / Trade-offs

- [Risk: `stable` replaces the latest version's segment (no `/0.21/` alongside `/stable/`)] → Mitigation: accepted — older versions keep their own segments; document the URL scheme.
- [Risk: refname projection syntax is Antora-version-sensitive] → Mitigation: spike the projection against Antora 3.1 before finalizing; keep it in `antora.yml` so it travels with content.
- [Risk: `main` as a named prerelease must be visibly marked as development] → Mitigation: `prerelease: true` plus the `/main/` URL segment make it explicit.
- [Risk: existing URLs/bookmarks break] → Mitigation: use Antora's static redirect facility; mark the URL change BREAKING in the changelog.

## Migration Plan

1. Spike named-prerelease `main` + projection + `stable` segment in a throwaway playbook; confirm URL scheme and selector ordering.
2. Edit `examples/tracer/antora.yml` (`version: main` + `prerelease: true` on `main`; projection for branches) and `antora-playbook-ci.yml` (`latest_version_segment: stable`, build `main` + maintenance branch).
3. Add the release-consistency script; wire it into CI (and optionally pre-commit).
4. Update the `publish` skill and explanation/reference docs.
5. Rebuild the site; verify `/main/`, `/stable/`, and each released version segment.

## Open Questions

Resolved by the spike (Antora 3.1):

- Projection syntax: `v(?<v>+({0..9}).+({0..9})).x: $<v>` derives `0.20` from branch `v0.20.x` (Antora's pattern syntax, not regex).
- `version: main` + `prerelease: true` serves the dev docs at `/main/` and is excluded from "latest stable".
- `latest_version_segment: stable` points `/stable/` at the latest stable release; it auto-moves when a newer release is added, and the latest release is served only at `/stable/` (its own segment appears once it is no longer latest).
