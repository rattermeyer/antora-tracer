## Context

The Antora extension processes `.adoc` files grouped by component version in the `contentClassified` event. For each file, it normalizes the source path by stripping everything up to `/pages/`, producing a page-local identifier like `architecture` or `traceability/index`. This normalized value is stored as `Item.sourceFile` and later used in `buildXref` to construct Antora cross-references.

This works within a single module because `xref:architecture#ARC-001` resolves within the same module. However, Antora organizes content into modules under a component (e.g., `ROOT`, `requirements`). When a page moves to a different module, xrefs to items in other modules fail because the module prefix is missing — Antora needs `xref:ROOT:architecture#ARC-001` to resolve from the `requirements` module.

The module information IS available at processing time (`file.src.module`) but is discarded during normalization and never stored on items.

### Current data flow

```
file.src.path = "modules/ROOT/pages/architecture.adoc"
file.src.module = "ROOT"

    │ normalizeSourceFile()
    ▼
"architecture"   ← module ("ROOT") lost

    │ process(content, { sourceFile: "architecture" })
    ▼
Item { sourceFile: "architecture", ... }   ← no module info

    │ expandOutgoingMacros() → buildXref()
    ▼
"xref:architecture#ARC-001[...]"   ← module-agnostic
```

### Existing relevant code

- `normalizeSourceFile()` — strips module prefix (line 179–188)
- `buildXref()` — builds xref string without module awareness (line 554–573)
- `processAsciiDocFile()` — passes normalized sourceFile to `traceability.process()` (line 988–990)
- `Item` type — has `sourceFile?: string` but no `module` field (`types.ts`, line 15–22)
- `LinkResolver.itemToHtmlPath()` — strips `pages/` prefix, no module awareness (`LinkResolver.ts`, line 76–93)

## Goals / Non-Goals

**Goals:**
- Xrefs generated in `traceability:outgoing[]` and `traceability:incoming[]` macros correctly resolve across module boundaries
- Matrix HTML links navigate to items in any module
- Same-module xrefs continue to work unchanged (no regressions)
- Items defined in partials continue to use same-page anchors (no change)

**Non-Goals:**
- Cross-component xref resolution (items across different Antora components)
- Changing how items are keyed or deduplicated across modules
- CLI-only usage (the CLI has no module concept; it already works as-is)

## Decisions

### Decision 1: Add `component` and `module` fields to `Item` (not encode into `sourceFile`)

**Alternatives considered:**
- **Encode `component/module/page` into `sourceFile`**: Simpler change footprint but breaks the semantic contract of `sourceFile` as a page path. Existing code, tests, and Neo4j exports assume `sourceFile` contains just the page path. Would require changes across more files.
- **Add separate `component` and `module` fields**: Explicit, backward-compatible, and follows the existing pattern where `file.src.component` and `file.src.module` are already first-class Antora concepts. Both fields are `string | undefined` — absent for CLI usage, present for Antora builds.

**Decision**: Add optional `component?: string` and `module?: string` to `Item`. Even though the immediate need is cross-module, `component` follows the same pattern at zero additional complexity. Capturing it now avoids a second schema change later.

### Decision 2: Thread module through `DocumentParser.parse` options

`DocumentParser.parse()` already accepts `sourceFile` in its options. Add `module` to the same options object and store it on each parsed `Item` and `ItemRelationship`.

```ts
// DocumentParser.ts — parse options
interface ParserOptions {
  sourceFile?: string;
  module?: string;        // NEW
}
```

### Decision 3: `buildXref` compares component and module from a context object

The `expandOutgoingMacros` and `expandIncomingMacros` methods already know the current file being processed. They extract `currentFile` from `file.src.path`. Add a context object with `currentComponent` and `currentModule` from `file.src.component` and `file.src.module`.

`buildXref` then compares hierarchically:
```
// Build the path prefix for cross-component/module references
let path = item.sourceFile;

if (item.component && item.component !== currentComponent) {
  path = `${item.component}:${item.module || ''}:${item.sourceFile}`;
} else if (item.module && item.module !== currentModule) {
  path = `${item.module}:${item.sourceFile}`;
}
// else: same component AND same module → just sourceFile (no prefix)

return `xref:${path}#${item.id}[...]`;
```

This naturally handles all three cases: same-module, cross-module, cross-component. The hierarchy matches Antora's xref resolution order.

### Decision 4: LinkResolver handles component and module prefix in source files

For matrix HTML links, `LinkResolver.itemToHtmlPath()` currently strips `pages/` and adds `.html`. With component/module awareness, the link needs to include the full Antora output path.

LinkResolver doesn't know the context module/component. The simplest approach: when component or module is present, include them in the path. This works because:
- Matrix HTML files are served from `_attachments/traceability/`
- Pages are served at component root under `component/module/`
- `../../ROOT/architecture.html#ARC-001` navigates to the correct page

```ts
// LinkResolver.ts — itemToHtmlPath update
private itemToHtmlPath(item: Item): string {
  // ... existing URL/path normalization ...

  let result = sourceFile;
  if (item.module) {
    result = `${item.module}/${sourceFile}`;
  }
  return `${result}.html`;
}
```

Note: component is not needed in matrix links because matrices are scoped per component version (they live under the component's `_attachments/` directory). The `../../` prefix already navigates from `_attachments/traceability/` to the component root, and module takes it from there.

### Decision 5: Keep normalizeSourceFile as-is, add context separately

`normalizeSourceFile` converts `modules/ROOT/pages/architecture.adoc` → `architecture`. We have two options:

**A. Change normalizeSourceFile to encode full context**: Return `ROOT/architecture` or `tracer/ROOT/architecture` instead of `architecture`. This is a clean semantic change but affects all consumers.

**B. Keep normalizeSourceFile as-is, add component/module separately**: `normalizeSourceFile` keeps returning `architecture`, and component/module are passed through separate channels.

**Decision**: Option B. Minimal change to existing normalization logic. Component and module are captured from `file.src.component` and `file.src.module` before normalization and passed separately through `processAsciiDocFile` → `traceability.process()` → `DocumentParser.parse()` → `Item.component` / `Item.module`.

## Risks / Trade-offs

- **Broken xrefs during migration**: Existing sites with single-module, single-component layouts see no change (component and module are always the same → same-module xref). Multi-module sites that were silently broken now start working. Cross-component sites — currently impossible — become possible.
- **Path format change for LinkResolver**: Matrix HTML links change from `../../page.html` to `../../ROOT/page.html`. If external tooling parses these URLs expecting the old format, it may break. → Mitigation: The old format was already broken for multi-module sites; this is a correctness fix.
- **Neo4j export**: Items will now have `component` and `module` properties in exports. → Mitigation: This is additive, not breaking. Existing queries that don't reference these fields are unaffected.
- **CLI path**: CLI usage sets `component: undefined`, `module: undefined`. The `buildXref` logic degrades gracefully — when fields are absent, it behaves exactly as before.

## Open Questions

- Should `ItemRelationship` also get `component`/`module` fields? Currently relationships inherit their source file's context. → Leaning no; relationships are between items and items already have context info.
- Should xrefs use the `.adoc` extension in the path (e.g., `xref:ROOT:architecture.adoc#ID` vs `xref:ROOT:architecture#ID`)? → Test during implementation; Antora accepts both, but `.adoc` is the canonical form.
