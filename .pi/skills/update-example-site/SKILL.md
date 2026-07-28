---
name: update-example-site
description: Update the self-traceability example site to reflect the current as-is state of the project. Scans all OpenSpec specs, design decisions, and test files to regenerate requirements, architecture, and test-plan documents. Run after archiving a change.
---

# Update Example Site

Update the self-traceability example site (`examples/`) to reflect the current state of the project. The documents describe the **as-is situation**, not a diff of recent changes.

## When to Use

After archiving a change with `openspec-archive-change`, run this skill to refresh the example site so it reflects the complete current project state.

## Process

### 1. Scan All OpenSpec Specs

Read every spec file across all changes (active + archived):

```bash
find openspec/changes -path "*/specs/*.md" -o -path "*/archive/*/specs/*.md"
```

Each spec file contains requirements under `### Requirement:` headings with scenarios under `#### Scenario:`.

### 2. Update `requirements.adoc`

The file is at `examples/modules/ROOT/pages/requirements.adoc`. It contains `[item, id=REQ-XXX, role=requirement]` blocks.

**Merge strategy (preserve traceability links):**

- **Keep** existing items whose spec source still exists (same requirement heading in a spec file). Do not change their IDs.
- **Remove** items whose spec source no longer exists (requirement deleted from specs).
- **Add** new items for requirements found in specs that don't have a matching `REQ-XXX` yet. Assign fresh IDs sequentially.
- **Update** content for kept items if the spec text changed.

Each item should have:
- `id` — `REQ-NNN` (three-digit, zero-padded)
- `role=requirement`
- Title — the `### Requirement:` heading text
- Content body — the spec description text
- Source reference — which spec file it came from

Group items by capability area (matching the spec's parent directory name).

### 3. Update `architecture.adoc`

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

### 4. Update `test-plan.adoc`

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

### 5. Update `traceability.yml` if needed

The file is at `examples/traceability.yml`. Check if the roles, relations, or matrix definitions need updating:

- Roles should match the roles used in requirements, architecture, and test items.
- Relations should allow the `addresses` (architecture→requirement), `verifies` (test→requirement), and `validates` (test→architecture) patterns used in the documents.
- Matrices should provide useful cross-references of requirements against architecture and tests.

### 6. Regenerate traceability output

After all documents are updated, regenerate the matrices:

```bash
npm run build
node examples/run-example.js
```

This produces updated `matrix-requirements-architecture.*` and `matrix-requirements-tests.*` in `examples/modules/ROOT/attachments/traceability/`.

### 7. Rebuild the Antora site (optional)

If the Antora playbook is configured with a UI bundle:

```bash
npx antora antora-playbook.yml
```

Verify no xref warnings and the matrices are navigable.

### 8. Commit

Commit all updated files with a message like:

```
Update example site to reflect current project state

Requirements: N total (M added, K removed)
Architecture: unchanged / updated
Tests: N total (matches N test files)
Matrices: regenerated
```

## Guardrails

- **Preserve IDs** — never change an existing `REQ-XXX`, `ARC-XXX`, or `TST-XXX` id. Traceability links depend on stable IDs.
- **As-is, not diff** — the documents describe the complete current state, not what changed.
- **Grounded in specs** — every requirement must trace back to a spec file. Don't invent requirements.
- **Grounded in code** — test items must match actual test files. Architecture must match actual source layout.
- **Regenerate** — always run `run-example.js` after document changes to produce updated matrices.
