## Context

Antora's content catalog already knows where each file came from. Probed on this repository's own
playbook for `examples/tracer/modules/ROOT/pages/how-to/write-traceable-items.adoc`:

```
src.path           modules/ROOT/pages/how-to/write-traceable-items.adoc
src.abspath        /home/richard/devel/git/antora-tracer/core/examples/tracer/modules/ROOT/...adoc
src.origin.worktree   /home/richard/devel/git/antora-tracer/core
src.origin.startPath  examples/tracer
src.origin.gitdir     /home/richard/devel/git/antora-tracer/core/.git
src.origin.refname    main
```

`join(origin.worktree, origin.startPath)` is the component root, and joining `src.path` to it
produced an existing file in the probe. `harvestSiteFiles` currently drops all of it and returns
`path: file.src.path` (`src/SiteGraph.ts:60-71`).

Two constraints shape the design:

1. `partial-file-processing` already forbids recording build-machine filesystem locations in the
   published graph: a partial's `sourceFile` falls back to a repository-relative path rather than an
   absolute one, precisely so matrix links resolve without exposing build paths. Any new root field
   must respect that rule for published artifacts.
2. `graph-json-attachment` and `multi-source-diff` pin the snapshot's item fields. Adding a field to
   `Item` therefore has a serialization consequence that must be decided, not inherited.

## Goals / Non-Goals

**Goals:**

- Every harvested item resolves to exactly one file on disk, in a multi-source harvest, without the
  consumer being told a root out of band.
- The resolution uses metadata Antora already computed; no path guessing and no new configuration.
- Published artifacts keep their current behaviour: no absolute build-machine paths in `graph.json`
  or in the snapshot.

**Non-Goals:**

- Changing `Item.sourceFile` semantics. It stays component-root-relative; the root is new
  information, not a replacement.
- Resolving remote content sources. A source cloned from a URL has an origin whose `worktree` is the
  local cache checkout; recording that is correct but of limited use, and the published-artifact rule
  above takes precedence there.
- Making the editor's version question go away. `version` is already recorded; this change is about
  *where*, not *which version*.

## Decisions

**Decision 1 — two fields, not one.**

`Item` gains an optional source root, and the harvest returns it per file. Storing only a joined
absolute path would collapse two facts — repository/worktree location and the source's `startPath`
within it — into one, losing the ability to re-resolve after a checkout moves.

Path shape: record the root as the resolved directory of the content source, and let a consumer join
`sourceFile` to it. The published-artifact rule is satisfied by excluding the field from
serialization rather than by degrading its meaning, so the in-process value stays exact.

**Decision 2 — exclude the root from the snapshot, like `pubUrl`.**

`serializeSnapshot` already drops `pubUrl` with an explicit destructure and a documented reason
(`src/GraphSnapshot.ts:26-32`). The source root joins it: the snapshot's purpose is diffing two
harvests, and an absolute build path makes a snapshot machine-specific and non-comparable.
`graph-json-attachment`'s field list is consequently unchanged.

*Alternative rejected*: recording a repository-relative root string instead of an absolute one. It
keeps the snapshot clean but reintroduces exactly the ambiguity this change removes — the relative
root is only meaningful against a checkout that the consumer must supply anyway.

**Decision 3 — the CLI prefers the recorded root.**

`resolveSourceFilePath` (`src/cli.ts:240-252`) resolves `sourceFile` against `--input` and rejects a
path that escapes it. Where a root is recorded, it resolves against that root instead; where none is
(the local, non-Antora parse path), the current `--input` behaviour is retained unchanged.

**Decision 4 — record what the origin actually provides, and only that.**

`origin.worktree` and `origin.startPath` are read when present. A file whose origin lacks them (a
non-git source, a test fixture) gets no root rather than a guessed one, and consumers treat a missing
root as the single-source case they already handle.

## Risks / Trade-offs

- **A new `Item` field leaks into published artifacts** → Mitigation: the exclusion is implemented in
  the same change as the field, with a test asserting no absolute path appears in a serialized
  snapshot or in the published `graph.json` payload.
- **Consumers may treat a missing root as an error** → Mitigation: missing root is a valid state and
  is specified as such; the CLI keeps its existing fallback.
- **`sourceFile` and the root could drift apart for partials** → Mitigation: `partial-file-processing`
  already specifies how a partial's `sourceFile` is derived; this change adds the root without
  altering that derivation, and the partial path is covered by a test.
- **Recording a worktree path is not portable across machines** → Accepted, and it is the reason the
  value is excluded from serialized artifacts; the in-process consumer is the one that needs it.

## Migration Plan

Additive. Older snapshots deserialize unchanged, since the new field is optional and excluded from
serialization. No config or format-version bump.

## Open Questions

- Whether the field belongs on `HarvestedFile` only, with the item-building path resolving the root
  on demand, or on `Item` as well. The design assumes both, because a consumer that receives an
  `Item` alone (the graph, a snapshot in memory, an editor) cannot otherwise resolve it; if the
  serialization exclusion proves awkward, the fallback is to keep the root on `HarvestedFile` and
  thread it separately.
