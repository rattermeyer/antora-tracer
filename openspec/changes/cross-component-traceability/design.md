## Context

`registerContentClassifier()` builds the working graph per `component@version` and clears it between groups, so xref generation only ever sees one component's items. The `cross-module-xref` spec already specifies cross-component xrefs (`xref:component:module:page#id`) and `buildXref` implements them, but the per-component split means that branch is never exercised. The `graph-lifecycle` spec says isolation is per **version**, so the stricter component-level split is an implementation mismatch.

## Goals / Non-Goals

**Goals:**
- Relationship macros (`outgoing`, `incoming`, `links`) resolve xrefs to items in sibling components at the same version.
- Cross-version isolation stays intact (an item in `comp@v1` must not link to `comp@v2`).

**Non-Goals:**
- Cross-component matrix links — `LinkResolver` is component-agnostic and `Item` carries no `version`; defer to a follow-up.
- Cross-component `traceability:graph[]` correctness beyond what the shared working graph already gives.

## Decisions

1. **Group the working graph by version only.** Two components at the same version share one working graph, so `buildXref`'s existing cross-component branch runs. The `component@version` key becomes `version`.
2. **Track components per version** for attachment registration (matrices, overview, guidance), which must stay per component + version.
3. **Duplicate-ID detection spans components at a version.** IDs are site-unique; a collision across components at the same version is a real conflict and still fails the build.

## Risks / Trade-offs

- [Cross-version leakage] → unchanged: different versions remain separate groups.
- [Shared version strings] → two components publishing `main` now share a graph; this is the point (their xrefs resolve), and duplicate IDs still fail loudly.
