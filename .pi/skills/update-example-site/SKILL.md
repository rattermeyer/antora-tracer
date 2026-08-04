---
name: update-example-site
description: Update the self-traceability example site to reflect the current as-is state of the project. Scans all OpenSpec specs, design decisions, and test files to regenerate requirements, architecture, and test-plan documents. Run after archiving a change.
---

# Update Example Site

Update the self-traceability example site (`examples/`) to reflect the current state of the project. The documents describe the **as-is situation**, not a diff of recent changes.

## When to Use

After archiving a change with `openspec-archive-change`, run this skill to refresh the example site so it reflects the complete current project state.

## Process

### 1. Scan Main OpenSpec Specs

Read spec files from `openspec/specs/` (the source of truth — not archived changes):

```bash
ls openspec/specs/*/spec.md
```

Each spec file contains requirements under `### Requirement:` headings with scenarios under `#### Scenario:`.

The **requirement heading text** is the canonical title for each `REQ-XXX` item. REQ item titles MUST match the spec requirement heading exactly — this makes diffing trivial.

### 2. Diff requirements before updating

Before modifying `requirements.adoc`, show what will change:

1. Extract requirement titles from main specs (`### Requirement: ...`)
2. Extract existing REQ item titles from `examples/modules/ROOT/pages/requirements.adoc`
3. Compare the two sets:
   - **New**: titles in specs but not in requirements.adoc
   - **Removed**: titles in requirements.adoc but not in specs
   - **Title mismatch**: same ID but different title text

Present this diff to the user for confirmation before applying changes.

### 3. Update `requirements.adoc`

The file is at `examples/modules/ROOT/pages/requirements.adoc`. It contains `[item, id=REQ-XXX, role=requirement]` blocks.

**Merge strategy (preserve traceability links):**

- **Keep** existing items whose spec source still exists (same requirement heading in a spec file). Do not change their IDs.
- **Remove** items whose spec source no longer exists (requirement deleted from specs).
- **Add** new items for requirements found in specs that don't have a matching `REQ-XXX` yet. Assign fresh IDs sequentially.
- **Update** content for kept items if the spec text changed.

Each item should have:
- `id` — `REQ-NNN` (three-digit, zero-padded)
- `role=requirement`
- Title — the exact `### Requirement:` heading text from the spec (must match)
- Content body — the spec description text
- Source reference — which spec file it came from (`Source: openspec/specs/<capability>/spec.md`)

Group items by capability area (matching the spec's parent directory name).

### 4. Update `architecture.adoc`

The file is at `examples/modules/ROOT/pages/architecture.adoc`. It uses arc42 sections as `[item, id=ARC-XXX, role=design]`.

**Scan design decisions:**

Read `design.md` from all changes (active + archived). Each `### N. Decision Title` is an architecture decision. Each decision maps to one arc42 section.

Current sections:
- `ARC-001`: Introduction & Goals
- `ARC-002`: Building Block View (component diagram, responsibility table)
- `ARC-003`: Runtime View (processing sequence diagram)
- `ARC-004`: Architecture Decisions (decisions table)

**Update strategy:**

- Keep existing sections (they describe the architecture, which doesn't change often).
- Update the `addresses:` inline macros to reference the correct current `REQ-XXX` IDs.
- If new architecture patterns emerge (new components, new flows, new decisions), add them as new `ARC-XXX` items with fresh IDs.
- Update the PlantUML component diagram to match current `src/` layout.
- Update the runtime sequence diagram if the processing flow changed.

### 5. Update `test-plan.adoc`

The file is at `examples/modules/ROOT/pages/test-plan.adoc`. It contains `[item, id=TST-XXX, role=test]` blocks, one per test file.

**Scan current test files:**

```bash
ls test/*.test.ts
```

**Update strategy:**

- For each `.test.ts` file, create or update a `TST-XXX` item.
- Map each test file to the requirements it verifies by:
  1. Reading the test file to find which API methods/components it tests
  2. Cross-referencing with the current requirements list to find matching `REQ-XXX` IDs
  3. Populating `verifies:` inline macros
- Remove items for test files that no longer exist.
- Preserve existing IDs for stability.

### 6. Review `use-cases.adoc` for coverage gaps

The file is at `examples/modules/ROOT/pages/use-cases.adoc`. It contains `[item, id=UC-XXX, role=use_case]` blocks in Karl Wiegers tabular format.

**Scan user-facing capabilities:**

Read the user guide (`examples/modules/ROOT/pages/user-guide.adoc`) to identify all documented user-facing capabilities. The use cases should cover every major workflow the user guide describes.

**Review each existing use case for quality:**

1. **Actor scope** — does the actor name accurately describe who performs this workflow? A use case called "Business Analyst writes items" that applies equally to developers and test managers has a scope problem.
2. **Goal scope** — is this a genuine user goal or a tool-invocation task? "Get next ID from CLI" is a sub-step of item creation, not a user goal. Each use case should describe a complete workflow that delivers value independently.
3. **Preconditions** — are they testable? "The extension is installed" is testable; "the team understands traceability" is not.
4. **Postconditions** — are they measurable? "The traceability graph contains the new item" is measurable; "coverage improves" is vague.
5. **Alternate flows** — do they cover error scenarios the system actually handles? Each validation error, warning path, and edge case from the specs should have a corresponding alternate flow.

**Identify missing use cases:**

Cross-reference the user guide's capability sections against the existing use cases:

| User Guide Section | Expected Use Case |
|---|---|
| Getting Started / Configuration | Project setup and bootstrap |
| Writing Items | Item authoring (UC-001) |
| Rendering Macros | Item authoring (UC-001 covers this) |
| Items in Partials | Partial file organization (UC-004) |
| Configuration (extends) | Domain model definition (UC-002) |
| Matrices / Coverage Report | Coverage review (UC-005) |
| CLI validate | CI validation |
| Neo4j Export | Neo4j exploration |
| Graph Visualization | Visual dependency exploration |
| CLI matrix / stats | Covered by CLI validation (pipeline context) |

**Present the review for confirmation:**

1. List existing use cases with quality observations
2. List identified gaps (user guide capabilities with no use case)
3. Propose: merge too-narrow use cases, add new ones for gaps
4. Present the proposed use case outline before writing (ID, actor, goal, key flows)

Do not write new use cases until the user confirms the outline.

### 7. Update `traceability.yml` if needed

The file is at `examples/traceability.yml`. Check if the roles, relations, or matrix definitions need updating:

- Roles should match the roles used in requirements, architecture, test, and use-case items.
- Relations should allow the `addresses` (architecture→requirement), `verifies` (test→requirement), `validates` (test→architecture), and `leads_to` (use_case→requirement) patterns used in the documents.
- Matrices should provide useful cross-references of requirements against architecture, tests, and use cases.

### 8. Update `run-example.js`

The script at `examples/run-example.js` generates matrices by name. Ensure it uses matrix names from the current config, not hardcoded names:

```javascript
const matrixNames = configLoader.getConfig().matrices.map(m => m.name);
for (const matrixName of matrixNames) {
  // generate matrix...
}
```

If the script uses hardcoded matrix names, update them to match `traceability.yml`.

### 9. Regenerate traceability output

After all documents are updated, regenerate the matrices:

```bash
npm run build
node examples/run-example.js
```

This produces updated matrix files in `examples/modules/ROOT/attachments/traceability/`.

### 10. Rebuild the Antora site

```bash
npx antora generate antora-playbook.yml
```

Verify no xref warnings and the matrices are navigable.

### 11. Commit

Commit all updated files with a message like:

```
Update example site to reflect current project state

Requirements: N total (M added, K removed)
Architecture: unchanged / updated
Tests: N total (matches N test files)
Matrices: regenerated
```

## Guardrails

- **Preserve IDs** — never change an existing `REQ-XXX`, `ARC-XXX`, `TST-XXX`, or `UC-XXX` id. Traceability links depend on stable IDs.
- **As-is, not diff** — the documents describe the complete current state, not what changed.
- **Grounded in specs** — every requirement must trace back to a spec file. Don't invent requirements.
- **Grounded in code** — test items must match actual test files. Architecture must match actual source layout.
- **Title matching** — REQ item titles MUST match the spec's `### Requirement:` heading exactly. This makes diffing and future syncs trivial.
- **Use case quality** — each use case should describe a complete user goal, not a tool-invocation task. Verify actors, preconditions, postconditions, and alternate flows before writing. Cross-reference against the user guide to ensure all documented capabilities have use case coverage.
- **Regenerate and verify** — always run `run-example.js` after document changes to produce updated matrices. Then rebuild the site and check for xref errors.
