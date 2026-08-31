## Context

The CLI `diff` command compares two directories via `collectAdocFiles()` + `processFiles()`, keying items by bare ID. Antora, by contrast, aggregates multiple content sources (git remotes, local dirs, multiple branches/tags) into one content catalog at `contentClassified`, where the extension builds a graph spanning every component. Two correctness gaps follow for multi-repo sites: (1) the CLI never sees sources outside the scanned directory, and (2) `diffGraphs()` conflates same-ID items that live in different components or versions.

Antora's pipeline is separable — `@antora/content-aggregator` (`aggregateContent`) and `@antora/content-classifier` (`classifyContent`) resolve sources into a content catalog without running the costly `convertDocuments`/`composePage`/`publishFiles` stages. The core `RequirementsTraceabilityExtension.process()` already accepts arbitrary `{path, content}` plus `component`/`module`/`pubUrl`, so the harvest can feed it directly.

`diffGraphs(prev, next)` only reads `getAllItems()` and `getAllRelationships()` — no other graph state. A JSON snapshot of `{ items, relationships }` is therefore everything the diff needs, which lets the build step and the diff step be fully decoupled.

## Goals / Non-Goals

**Goals:**

- Build the full cross-source graph for a playbook without any site output, and persist it as a JSON snapshot.
- Diff two JSON snapshots without requiring either version to be checked out.
- Match items with component-scoped identity.
- Preserve the existing single-repo `diff` behavior (bare-ID) unchanged.

**Non-Goals:**

- Generating HTML/PDF/DOCX (this is graph-only).
- Rename detection (the diff stays ID-based, per the existing `graph-diff` spec).
- Walking git history automatically — a snapshot is produced explicitly by the harvest, not inferred from refs at diff time.

## Decisions

1. **Separate build from diff: harvest to a JSON snapshot, diff the JSON.** The harvest (`site-graph --playbook <p> --out <f>.json`) runs once per version at release/CI time. The diff (`diff-graphs --from <a>.json --to <b>.json`) runs later against stored snapshots. This removes the requirement to have two checkouts or two playbooks resolved simultaneously.
2. **Harvest via Antora's aggregate + classify, then stop.** Reuse `aggregateContent` + `classifyContent` to produce the content catalog, harvest `.adoc` pages and partials with their `component`/`module`/version metadata, and feed the core parser. Never call `convertDocuments`/`composePage`/`publishFiles`.
3. **Feed the core extension, not the Antora extension.** The harvest produces `{path, content, component, module, version}` entries and calls `RequirementsTraceabilityExtension.process()`/`processFiles()` directly, yielding a plain `TraceabilityGraph` ready for serialization and `diffGraphs()`. No Antora event wiring needed.
4. **Canonical snapshot format = `{ items, relationships }`.** Items carry `id`, `role`, `title`, `content`, `status`, `attributes`, `component`, `module`, `version`, `sourceFile`, `sourceLine`; relationships carry `fromId`, `type`, `targetId`, `sourceFile`, `line`. Nothing else on the graph is serialized, because the diff never reads it.
5. **Diff at the data level.** Provide a JSON→graph (or data-level) entry point so `diffGraphs`'s matching logic runs over two `{items, relationships}` snapshots without reconstructing a full `TraceabilityGraph`.
6. **Identity = component-qualified, version-aware.** Extend `diffGraphs()` so the match key is `component` (plus `version` when present) followed by `id`; items without `component` (the existing CLI path) fall back to bare `id`. `GraphDiff`/`ItemDelta`/`RelationshipDelta` shapes stay the same.
7. **Separate `diff-graphs` command.** The snapshot diff is a distinct verb (`diff-graphs --from <a>.json --to <b>.json`), leaving the existing `diff` (AsciiDoc directories) untouched. Sniffing `.json` vs directory inside one command would be fragile (a directory named `*.json`, a non-snapshot JSON file) and would overload `--from`/`--to`; a separate verb keeps error messages and the `graph-diff` "scans two source paths" contract clean.
8. **Versioned snapshot format.** The snapshot carries a top-level `format: 1` field. Snapshots are durable, committed artifacts diffed against historical releases, so a future shape change must fail explicitly; the loader rejects unknown `format` values with "re-run `site-graph`" guidance rather than silently mis-parsing.

**Alternatives considered:**

- *Two playbooks resolved at diff time* — correct, but requires both snapshots to be resolvable simultaneously. Rejected in favor of stored JSON snapshots.
- *Point the existing `diff` at a common parent directory* — works only when all repos are checked out under one root, and ignores the playbook's `start_paths`/ref selection. Rejected: not faithful to the site Antora actually builds.
- *Run the full Antora build and diff the extension's `fullGraph`* — correct, but pays the whole HTML/PDF cost. Rejected: violates the no-output goal.

## Risks / Trade-offs

- [Antora-internal packages become direct deps] → `@antora/content-aggregator` and `@antora/content-classifier` are stable Antora 3 packages; pin to the version already resolved and make them optional so the CLI still works without them.
- [Snapshot drift] → a stored snapshot reflects the moment it was produced, not the live sources. Mitigation: snapshots are immutable release artifacts; re-run the harvest to refresh.
- [JSON has no enforced schema] → validate the `{items, relationships}` shape on load and reject malformed snapshots with a clear error.
- [Multi-version components within one snapshot] → a component can publish `main` and `v1.0` in one build, so identity includes `version` when present.

## Migration Plan

Additive. The existing `diff` command and `diffGraphs()` output are unchanged for single-repo inputs. New behavior activates only through the `site-graph` harvest and the JSON-consuming diff mode.

## Open Questions

None — command shape and snapshot versioning were resolved during design (Decisions 7 and 8).
