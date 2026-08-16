---
name: update-example-site
description: Update the self-traceability example site to reflect the current as-is state of the project. Scans all OpenSpec specs, design decisions, and test files to regenerate requirements, architecture, and test-plan documents. Run after archiving a change.
---

# Update Example Site

Update the self-traceability example site (`examples/tracer/`) to reflect the complete current state of the project.
The documents describe the **as-is situation**, not a diff of recent changes.

## Key File Paths

| Document | Path |
|---|---|
| Requirements index | `examples/tracer/modules/requirements/pages/index.adoc` |
| Architecture | `examples/tracer/modules/ROOT/pages/explanation/architecture.adoc` |
| Processing pipeline | `examples/tracer/modules/ROOT/pages/explanation/processing-pipeline.adoc` |
| Test plan | `examples/tracer/modules/ROOT/pages/self-traceability/test-plan.adoc` |
| Use cases | `examples/tracer/modules/ROOT/pages/self-traceability/use-cases.adoc` |
| Diagrams | `examples/tracer/modules/ROOT/examples/*.puml` |
| Traceability config | `examples/traceability.yml` |
| Matrix generator | `examples/run-example.js` |

## Item Syntax

All items use this format — **not** `[item, id=...]`:

```asciidoc
[#REQ-NNN, item, role=requirement, title="Short title"]
--
The system SHALL <observable behaviour>.

Source: openspec/specs/<capability>/spec.md

traceability:links[]
--
```

Roles: `requirement`, `process_requirement`, `design`, `test`, `use_case`.

## When to Use

After archiving a change with `openspec-archive-change`, run this skill to refresh the example site so it reflects the complete current project state.

## Process

### 1. Scan Main OpenSpec Specs

Read spec files from `openspec/specs/` (the source of truth — not archived changes):

```bash
ls openspec/specs/*/spec.md
```

Each spec file contains requirements under `### Requirement:` headings.
The **requirement heading text** is the canonical title for each REQ item.
REQ item titles MUST match the spec requirement heading exactly — this makes future diffing trivial.

### 2. Diff Requirements Before Updating

Before modifying `index.adoc`, show what will change:

1. Extract requirement titles from main specs (`### Requirement: ...`)
2. Extract existing REQ item titles from `examples/tracer/modules/requirements/pages/index.adoc`
3. Compare:
   - **New**: titles in specs but not in index
   - **Removed**: titles in index but not in specs
   - **Title mismatch**: same ID but different title text

Present the diff to the user for confirmation before applying changes.

### 3. Update the Requirements Index

File: `examples/tracer/modules/requirements/pages/index.adoc`

**Merge strategy (preserve traceability links):**

- **Keep** existing items whose spec source still exists. Do not change their IDs.
- **Remove** items whose spec source no longer exists.
- **Add** new items for requirements found in specs that don't have a matching REQ-NNN yet. Assign fresh IDs sequentially using `antora-tracer next-id --prefix REQ`.
- **Update** body text for kept items if the spec text changed.

Each item block:

```asciidoc
[#REQ-NNN, item, role=requirement, title="<exact spec heading text>"]
--
<spec description text>

Source: openspec/specs/<capability>/spec.md

traceability:links[]
--
```

Group items by capability area (matching the spec's directory name).

**After updating requirements**, run the downstream consistency sweep from the `requirements-writing` skill — architecture doc, processing-pipeline doc, test comments, and test-plan `verifies:` links may all need updating when requirements are added, removed, or split.

### 4. Update `architecture.adoc`

File: `examples/tracer/modules/ROOT/pages/explanation/architecture.adoc`

This file contains ARC items (`role=design`) covering building blocks, runtime view, component designs, and architecture decisions. ARC IDs currently run from ARC-001 to ARC-033.

**What to check:**

- ARC item bodies that describe behaviour changed by the archived change
- `addresses:REQ-NNN[]` links pointing to removed or split requirement IDs
- Pass table (scope column) — must match actual implementation scope (pages vs pages+partials)
- Component descriptions — must match current source layout and class names

**Diagrams** live in `examples/tracer/modules/ROOT/examples/*.puml`:

| File | What it shows | When to update |
|---|---|---|
| `bb-overview.puml` | Component dependencies | New component added or removed |
| `api-overview.puml` | Public class/API surface | Interface signatures change |
| `config-resolution.puml` | Config loading flow | ConfigLoader logic changes |
| `sequence-diagram.puml` | Antora build event flow | Extension event handling changes |
| `pass-pipeline.puml` | Pass ordering within contentClassified | Pass structure changes |
| `prepared-file-caching.puml` | File state caching | PreparedFile logic changes |
| `parser-flow.puml` | DocumentParser internal activity | Parser algorithm changes |
| `graph-lifecycle.puml` | TraceabilityGraph state lifecycle | Graph state machine changes |
| `docx-pipeline-comparison.puml` | PDF vs DOCX build pipeline | DOCX/PDF pipeline changes |

Diagrams are included via `[plantuml]\n----\ninclude::example$name.puml[]\n----`.

### 5. Update `processing-pipeline.adoc`

File: `examples/tracer/modules/ROOT/pages/explanation/processing-pipeline.adoc`

This doc describes the four passes within `contentClassified` and the graph lifecycle.

**What to check:**

- Pass headings and scope annotations (e.g., "pages and partials" vs "pages only")
- Pass descriptions — must match what the implementation actually does
- Graph lifecycle steps — creation, population, quiescent, macro expansion, finalization

### 6. Update `test-plan.adoc`

File: `examples/tracer/modules/ROOT/pages/self-traceability/test-plan.adoc`

Contains TST items (`role=test`), one per test file.

**Scan current test files:**

```bash
ls test/*.test.ts
```

**Update strategy:**

- For each `.test.ts`, create or update a TST-NNN item.
- TST item body: describe what the test file covers (which components, which scenarios).
- `verifies:REQ-NNN[]` links: cross-reference with current REQ IDs for requirements the tests exercise.
- Remove items for test files that no longer exist.
- Add `verifies:` for any new REQ IDs (especially after splits) that the existing tests already cover.
- Preserve existing TST IDs.

**Common staleness patterns:**

- `it()` description in test file says "skip" or "only" when behaviour now applies to more cases → update TST body
- New REQ IDs from a requirement split not yet in the `verifies:` list → add them
- Removed requirement ID still in `verifies:` list → remove it

### 7. Review `use-cases.adoc` for Coverage Gaps

File: `examples/tracer/modules/ROOT/pages/self-traceability/use-cases.adoc`

Contains UC items (`role=use_case`) in Karl Wiegers tabular format.

**Review each existing use case for quality:**

1. **Actor scope** — does the actor describe who actually performs this workflow?
2. **Goal scope** — is this a complete user goal, not just a tool invocation?
3. **Preconditions** — testable? ("The extension is installed" yes; "the team understands traceability" no)
4. **Postconditions** — measurable? ("graph contains the new item" yes; "coverage improves" no)
5. **Alternate flows** — do they cover error scenarios the system actually handles?

**Identify gaps** by cross-referencing user-facing capabilities in `how-to/` pages against existing use cases. Present a proposed outline (ID, actor, goal, key flows) for confirmation before writing new use cases.

### 8. Check `traceability.yml`

File: `examples/traceability.yml`

Check that roles, relations, and matrix definitions still match what the documents use:

- Roles: `requirement`, `process_requirement`, `design`, `test`, `use_case`
- Relations: `addresses`, `verifies`, `validates`, `leads_to` (and their inverses)
- Matrices: one per cross-cutting concern (requirements↔design, requirements↔tests, etc.)

### 9. Regenerate Traceability Output

```bash
npm run build
node examples/run-example.js
```

`run-example.js` reads matrix names from the config and generates CSV and HTML matrix files into `examples/tracer/modules/ROOT/attachments/traceability/`.

### 10. Rebuild the Antora Site

```bash
npx antora antora-playbook.yml
```

Check for xref warnings. Verify matrices are navigable and link to the correct requirement anchors.

### 11. Commit

```
docs(example-site): update self-traceability to reflect current state

Requirements: N total (M added, K removed, P updated)
Architecture: <unchanged | updated ARC-NNN body | added ARC-NNN>
Test plan: N total (verifies: updated for REQ-NNN splits)
Matrices: regenerated
```

## Guardrails

- **Preserve IDs** — never change an existing REQ-NNN, ARC-NNN, TST-NNN, or UC-NNN. Traceability links depend on stable IDs.
- **As-is, not diff** — documents describe the complete current state, not what recently changed.
- **Grounded in specs** — every requirement must trace back to a spec file. Do not invent requirements.
- **Grounded in code** — TST items must match actual test files. ARC items must match actual source layout and class names.
- **Title matching** — REQ item titles MUST match the spec's `### Requirement:` heading exactly.
- **Run the consistency sweep** — after updating requirements, check architecture docs, test `it()` descriptions, and test-plan `verifies:` links. The `requirements-writing` skill's "After Changing Requirements" section gives the generic principle; the detailed project-specific sweep is the steps in this skill.
- **Regenerate and verify** — always run `run-example.js` after document changes, then rebuild and check for xref errors.
