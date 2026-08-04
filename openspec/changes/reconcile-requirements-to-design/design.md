# Design: Reconcile Requirements-to-Design Coverage

## D1: Mapping Uncovered REQs to Existing ARC Items

Each uncovered REQ is assigned to the ARC item that owns the component responsible for implementing it. The principle: an ARC item "addresses" a REQ if the ARC describes the component or mechanism that fulfills the requirement.

### ARC-017 "Regex-based parsing" ← REQ-087..092 (verbatim handling)

`findVerbatimRanges()` and `isInsideRange()` live in `DocumentParser`. ARC-017 owns the parser. ARC-002's pass-pipeline diagram already shows verbatim detection in Pass 1.

```
  + REQ-087  Items inside verbatim blocks are not parsed
  + REQ-088  Inline macros inside verbatim blocks are not parsed
  + REQ-089  Old macros inside verbatim blocks do not trigger errors
  + REQ-090  Verbatim block detection handles standard AsciiDoc fences
  + REQ-091  Inline macros inside verbatim blocks are preserved in rendered output
  + REQ-092  Inline macros inside backtick code spans are not parsed
```

### ARC-015 "In-memory processing with no side effects" ← REQ-050, 069

ARC-015 states "No .adoc source files are ever modified on disk." REQ-050 and REQ-069 are the spec requirements for that architectural invariant. ARC-024 also respects it, but ARC-015 is the principle owner.

```
  + REQ-050  Source file not modified
  + REQ-069  Source file not modified by incoming macro
```

### ARC-024 "Link rendering" ← REQ-064..070, 100, 101, 102, 104

All implemented by `expandRelationMacros()`. ARC-024 already holds REQ-044, 045, 047, 048, 055 — these are the remaining sub-features of the same method.

```
  + REQ-064  Incoming macro respects document attributes
  + REQ-065  Incoming macro display styles
  + REQ-066  Incoming macro sort order
  + REQ-067  Inverse relation type labels
  + REQ-068  Incoming macro PDF compatibility
  + REQ-070  Incoming macro supports collapsible output
  + REQ-100  Inline macros suppressed when links macros are active
  + REQ-101  PDF compatibility
  + REQ-102  Collapsible list-style output via document attribute
  + REQ-104  traceability:links[] macro renders combined outgoing and incoming
```

### ARC-025 "Graph visualization macros" ← REQ-063

`expandGraphMacros()` and `expandCoverageMacros()` generate Kroki URLs. The `krokiImageFormat` config option controls the format used in those URLs.

```
  + REQ-063  Configurable Kroki image format
```

### ARC-016 "Event-driven Antora integration" ← REQ-103

`groupByVersion()` isolation happens inside the `contentClassified` handler. ARC-016 owns the event pipeline.

```
  + REQ-103  Graph isolation per component version
```

### ARC-018 "Config-driven validation" ← REQ-071

`inverseLabels` is a YAML config field loaded by `ConfigLoader`. ARC-018 owns config-driven behavior.

```
  + REQ-071  Inverse labels are config-driven
```

### ARC-019 "Config-driven matrix generation" ← REQ-083..086

Preset-defined matrices are read by `MatrixGenerator`. ARC-019 owns matrix generation from config.

```
  + REQ-083  Preset defines pairwise requirements-to-design matrix
  + REQ-084  Preset defines pairwise design-to-implementation matrix
  + REQ-085  Preset defines pairwise requirements-to-tests matrix
  + REQ-086  Preset does not define wide multi-column matrices
```

### ARC-027 "Matrix sync" ← (new REQ from matrix-attachment-sync spec)

```
  + REQ-108  Matrix files synced to component _attachments
```

### ARC-028 "Circular reference detection" ← (new REQ from circular-reference-detection spec)

```
  + REQ-109  Circular reference detection in graph validation
```

### ARC-029 "Partial file processing" ← (new REQ from partial-file-processing spec)

```
  + REQ-110  Items defined in partials are processed
```

---

## D2: Four New ARC Items

### ARC-030 "CI/CD PDF build and deployment pipeline"

Covers the GitHub Actions workflow that builds HTML + PDF + landing page, the devbox/Gemfile Ruby toolchain, and assembler profiles for split-output PDFs.

```
  addresses: REQ-060, 061, 062 (ci-pdf-deploy)
  addresses: REQ-093, 094, 095, 096 (pdf-output)
  addresses: REQ-097, 098, 099 (split-pdf-documents)
```

### ARC-031 "Static landing page at GitHub Pages root"

A static `index.html` with Tailwind CDN at the GitHub Pages root `/`, deploying alongside the Antora docs at `/docs/`. Zero build step, conemso branding.

```
  addresses: REQ-072..078 (landing page, 7 requirements)
```

### ARC-032 "Lunr search extension customization for item anchor indexing"

Customizes `@antora/lunr-extension` to index non-heading elements with IDs as separate search chunks, extracting `.title` children as chunk titles, scoped to `<article class="doc">`.

```
  addresses: REQ-079, 080, 081, 082 (lunr-item-anchor-indexing)
```

### ARC-033 "Example site: config extension and dashboard patterns"

Documents the example site's architectural patterns: extending the `requirements-engineering` preset with a custom `use_case` role, the dashboard page with embedded graph macros, and the self-traceability workflow. These are "site architecture" rather than extension architecture.

```
  addresses: REQ-054  (Dashboard page in example site)
  addresses: REQ-105, 106, 107 (use-case example)
```

---

## ADR-006: DFS-Based Circular Reference Detection

### Status

Accepted

### Context

The traceability graph is a directed graph of items connected by typed relationships. Users can create cycles — either accidentally (bidirectional `addresses`/`addressed-by` pairs where the inverse is explicit) or deliberately (complex traceability chains). Auto-generated inverse relationships create implicit backward edges that should NOT count as cycles.

The detection runs during `validate()`, which is called after all files are processed. It needs to find all cycles and report them with human-readable paths.

### Decision

Use **iterative DFS with an explicit stack**, tracking both `visited` (fully explored) and `recursionStack` (currently on the exploration path).

- Auto-generated inverse relationships (`rel.autoGenerated === true`) are **skipped entirely** — cycle detection only follows explicitly declared forward edges.
- Each cycle is reported once as `"Circular reference detected: A -> B -> C -> A"`.
- Self-referencing edges (A → A) are detected as 1-node cycles.

### Alternatives Considered

| Approach | Why Rejected |
|----------|-------------|
| BFS | Cannot easily report the cycle path; DFS naturally captures the path in the recursion stack. |
| Union-Find | Only detects connectivity, not cycles in a directed graph. Doesn't produce cycle paths. |
| Tarjan's SCC | Overkill — finds ALL strongly connected components, not just simple cycles. More complex to implement, harder to produce user-friendly error messages. |
| Following inverse edges | Would produce false positives — every explicit `addresses` creates an implicit `addressed-by`, creating trivial 2-cycles everywhere. |

### Consequences

- DFS is O(V + E) per traversal, called once per item — O(V² + V·E) worst case. Acceptable for typical traceability graphs (hundreds of items).
- Skipping auto-generated inverse edges means users CAN have `A addresses B` and `B addressed-by A` without triggering a cycle — the inverse is implicit.
- Users who explicitly declare both directions (e.g., manual `B addresses A` alongside `A addresses B`) WILL get a cycle detected — this is intentional; the system treats explicitly declared relationships as the user's intent.

---

## ADR-007: Partial Files — Graph Population Only (Pass 1)

### Status

Accepted

### Context

Antora partial files (`family: partial`) contain reusable AsciiDoc content included into pages via `include::partial$...[]`. Items defined in partials need to appear in the traceability graph (so matrices show them and relationships to them resolve), but partials do not produce standalone HTML pages.

The extension processes files in two passes during `contentClassified`:
- **Pass 1**: Parse items and inline macros → populate the graph
- **Pass 2**: Expand `traceability:outgoing[]`, `traceability:incoming[]`, and `traceability:links[]` macros → substitute inline macros with xrefs

### Decision

Process partial files in **Pass 1 only**. Skip Pass 2 for partials.

- Items in partials are registered in the graph with `sourceFile` set to the partial's **view URL** (pointing to the source repository, not the output site).
- Xref generation for partial items uses `link:` URLs (not `xref:`) since partials produce no HTML pages.
- When a partial item's source includes `/partials/` in the path, xref generation falls back to a same-page anchor (`xref:#ID`).

### Alternatives Considered

| Approach | Why Rejected |
|----------|-------------|
| Process partials fully (Pass 1 + Pass 2) | Would expand `traceability:outgoing[]` in files that never render as HTML. The expanded content is discarded. Unnecessary work, potential for confusing behavior if macro expansion produces xrefs to non-existent pages. |
| Skip partials entirely | Items defined only in partials would be invisible to the traceability graph. Users who organize items in partial files (a recommended practice for large projects) would lose traceability. |
| Generate stub pages for partials | Violates Antora's content model. Partials are not pages. Would require creating fake pages, interfering with navigation and search. |

### Consequences

- Partial items appear in matrices with `link:` URLs pointing to the source repository, not the output site. This is the correct behavior — the partial's "location" is its source file.
- `traceability:outgoing[]` and `traceability:incoming[]` are NOT expanded in partials. Users who want rendered relationship lists must place those macros in the page that includes the partial, not in the partial itself.
- Xrefs from pages TO partial items fall back to same-page anchors — clicking a link to a partial item navigates within the current page (the including page) rather than to a separate page.
