## 1. Presets and configuration

- [x] 1.1 Add `supersedes` (reverse `superseded_by`) to applicable same-role pairs in the built-in presets
- [x] 1.2 Document the generic supersession convention; do not require a redundant `status=superseded` attribute

## 2. Graph semantics

- [x] 2.1 Add helpers to retrieve direct successor(s) and determine graph-derived effective supersession
- [x] 2.2 Validate self-supersession, duplicate history links, and supersession cycles
- [x] 2.3 Classify `supersedes` / `superseded_by` as history relations so they can be excluded from stale-link worklists

## 3. Current-state matrices

- [x] 3.1 Exclude effectively superseded items from matrix rows by default
- [x] 3.2 Exclude effectively superseded items from matrix column cells by default
- [x] 3.3 Add a configuration/API option to include historical items when explicitly requested

## 4. Visible impact in relationship views

- [x] 4.1 Keep functional links to superseded items visible in outgoing/incoming/combined macros
- [x] 4.2 Mark such links `review required` and list all direct successors in deterministic ID order
- [x] 4.3 Render superseded source blocks with a marker linking all direct successors

## 5. Read-only CLI

- [x] 5.1 Add `supersession check <id>` to report effective state, direct successors, and direct incoming functional links grouped by role/relation type
- [x] 5.2 Add `--impact` to include the transitive blast radius from `getImpactAnalysis()`
- [x] 5.3 Ensure the command performs no source-file writes

## 6. Advisory validation

- [x] 6.1 Warn when a functional relation targets an effectively superseded item, naming source, relation, predecessor, and all direct successors
- [x] 6.2 Exclude history relations from this warning
- [x] 6.3 Keep the warning non-blocking

## 7. Skill and documentation

- [x] 7.1 Update `skills/requirements-writing/SKILL.md`: supersede rather than mutate; review each direct incoming link; decide revise/supersede/repoint/retain explicitly
- [x] 7.2 Document matrix filtering, visible review markers, supersession graph rules, and the read-only CLI in Reference/How-to pages
- [x] 7.3 State that baseline mutation detection, cross-version links, archive pages, changelog generation, automatic repointing, and strict gating are deferred

## 8. Tests

- [x] 8.1 One-to-one, split, and merge supersession tests
- [x] 8.2 Self-reference, duplicate, and cycle validation tests
- [x] 8.3 Matrix row/column filtering tests
- [x] 8.4 Macro test: stale functional link remains visible, marked review-required, and lists multiple successors
- [x] 8.5 History relationship is not reported as suspect
- [x] 8.6 Superseded block marker links all successors
- [x] 8.7 CLI direct and transitive reports; verify no source files change
- [x] 8.8 Advisory warning test: correct fields, no validation failure
