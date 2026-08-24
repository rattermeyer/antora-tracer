## Context

The example site's Antora component version is hand-maintained as a literal in `examples/tracer/antora.yml`. This literal has drifted from the real release — it sat at `0.13` while npm reached `0.19.0`. The release process also produced a tag that could not be built because a tag is immutable and the Vale lint (added later, running from `main`'s rules) flags the frozen content.

Antora 3.1 offers two native mechanisms (verified in the docs):
- `version: ~` (or `version: null`) marks a component version as **unversioned**, which Antora *always* treats as the latest version.
- A **refname projection** derives the version from the git refname via a pattern→replacement map (e.g. `v0.20.x` → `0.20`).
- Symbolic segments (`latest_version_segment`, `latest_prerelease_version_segment`) never apply to unversioned components.

## Goals / Non-Goals

**Goals:**
- Remove the hand-maintained `version` literal from `antora.yml` so it cannot drift.
- Keep the multi-version demo (3+ versions are planned for demo purposes).
- Make the remaining release invariants executable — fail loudly, not silently.

**Non-Goals:**
- Not automating the npm release (`npm publish`) or adopting a release tool (release-it etc.).
- Not changing the extension's graph/rendering behavior.

## Decisions

### D1: `main` is unversioned (`version: ~`)

`main`'s `antora.yml` sets `version: ~`, a constant that never changes. Antora treats an unversioned component as always-latest, so the current docs live at the component root with no version segment.

*Alternatives considered:* `version: true` (refname as version) → yields `main`, a named identifier that sorts lexicographically and isn't a clean "latest" signal; rejected. A literal prerelease version (`0.21-wip`) → reintroduces the drift; rejected.

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

### D4: Drop the `latest`/`unstable` symbolic segments and the prerelease demo

Symbolic segments never apply to unversioned components, so with `main` unversioned the `latest`/`unstable` machinery no longer decorates `main`. Remove the two `urls` keys and the `-wip` prerelease (or relocate the prerelease demo — see Open Questions).

## Risks / Trade-offs

- [Risk: unversioned `main` loses the prerelease/`unstable` demo] → Mitigation: accept as a deliberate demo tradeoff, or relocate prerelease to a dedicated `release/*` branch.
- [Risk: refname projection syntax is Antora-version-sensitive] → Mitigation: spike the projection against Antora 3.1 before finalizing; keep it in `antora.yml` so it travels with content.
- [Risk: `latest` segment interaction with unversioned main is subtle] → Mitigation: confirm behavior in the spike; document the resulting URL scheme.
- [Risk: existing URLs/bookmarks break] → Mitigation: use Antora's static redirect facility; mark the URL change BREAKING in the changelog.

## Migration Plan

1. Spike unversioned-`main` + projection in a throwaway playbook; confirm URL scheme and selector ordering.
2. Edit `examples/tracer/antora.yml` (`version: ~` on `main`; projection for branches/tags) and `antora-playbook-ci.yml` (build `main` + maintenance branch).
3. Add the release-consistency script; wire it into CI (and optionally pre-commit).
4. Update the `publish` skill and explanation/reference docs.
5. Rebuild the site; verify the selector shows main (default/latest) plus each released version.

## Open Questions

- Where does the prerelease demo go, if anywhere — a dedicated `release/*` branch, or drop it?

Resolved by the spike (Antora 3.1):

- Projection syntax: `v(?<v>+({0..9}).+({0..9})).x: $<v>` derives `0.20` from branch `v0.20.x` (Antora's pattern syntax, not regex).
- `version: ~` on `main` produces unversioned content at the component root, treated as latest.
- `latest_version_segment` is a no-op with unversioned `main` — remove it (and `latest_prerelease_version_segment`).
