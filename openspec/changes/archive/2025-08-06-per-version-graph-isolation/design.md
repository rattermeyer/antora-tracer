## Context

The `contentClassified` event fires once per Antora build with all component versions' content. The current code iterates all pages in a flat loop, processing items into a shared `TraceabilityGraph`. The `expandOutgoingMacros`/`expandIncomingMacros` and `substituteLinksInFile` methods then generate xrefs using this shared graph — which may contain items from other component versions.

Antora xrefs are version-scoped: a page in `v0.10.x` can only xref to pages in `v0.10.x`. The fix ensures the graph only contains items from the version currently being processed.

## Goals / Non-Goals

**Goals:**
- Each component version's pages only generate xrefs to items within the same version
- Items from version A never leak into version B's xref generation
- Single-version builds continue to work identically

**Non-Goals:**
- Cross-version traceability (xrefs between versions don't work in Antora anyway)
- Changing the CLI behavior
- Changing the self-traceability example structure

## Decisions

### Decision: Group files by version and clear graph between groups

The `contentClassified` event provides access to `contentCatalog.getComponents()`, each with `component.versions`. Each version has a `files` array. We can group page files by their `src.version`:

```typescript
const filesByVersion = new Map<string, any[]>();
for (const file of adocFiles) {
  const version = file.src?.version || "unknown";
  if (!filesByVersion.has(version)) filesByVersion.set(version, []);
  filesByVersion.get(version)!.push(file);
}
```

Then process each group independently:

```typescript
for (const [version, files] of filesByVersion) {
  this.traceability.graph.clear();
  for (const file of files) {
    this.processAsciiDocFile(file);
  }
  // Expand macros, substitute links for this version's files only
  for (const file of files) {
    this.expandOutgoingMacros(file);
    this.expandIncomingMacros(file);
    this.expandGraphMacros(file);
    this.expandCoverageMacros(file);
  }
  for (const file of files) {
    this.substituteLinksInFile(file);
  }
}
```

### Decision: Partial files are also version-scoped

Partials should be grouped by version too, so items from partials don't leak across versions either. Same grouping logic applies.

### Decision: sitePublished (matrix generation) runs once after all versions

The `sitePublished` event fires after all content is classified. Matrix generation uses the full graph and should continue to do so. The graph's final state after the last version is processed contains only that version's items, which is fine for single-version builds. For multi-version builds, matrices could be generated per-version or use the last version — either is acceptable since CI typically builds one version per deployment.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `sitePublished` matrix generation uses last version's graph only | Acceptable — CI deploys one version per playbook run. If multi-version matrix generation is needed later, it can be added. |
| Tests may need updating for version grouping | Existing tests pass a single file, so they're unaffected. |
