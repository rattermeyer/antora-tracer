## 1. Diff module

- [x] 1.1 Add `src/GraphDiff.ts` with `ItemDelta`, `RelationshipDelta`, and `GraphDiff` types
- [x] 1.2 Implement `diffGraphs(old, new)`: set differences by ID plus field-level `modified` over `title`/`content`/`role`/`status`/`attributes`
- [x] 1.3 Implement the relationship delta limited to surviving items

## 2. Public API

- [x] 2.1 Export `diffGraphs` and the delta types from `src/index.ts`

## 3. CLI

- [x] 3.1 Add `diff` command with `--from <path>` / `--to <path>` / `--json` options in `src/cli.ts`
- [x] 3.2 Reuse `collectAdocFiles` + `processFiles` to build the two graphs
- [x] 3.3 Print a human-readable table by default; JSON with `--json`

## 4. Tests

- [x] 4.1 Added / removed / unmodified-survivor classification
- [x] 4.2 Field-level modified reporting (`content`, `title`, `role`, `status`, `attributes`)
- [x] 4.3 Relationship deltas only for surviving items
- [x] 4.4 Superseded pair reported as removed + added with the `supersedes` relationship
- [x] 4.5 CLI diff output and `--json`; verify no source files are modified

## 5. Documentation

- [x] 5.1 `reference/api.adoc` — document `diffGraphs` and the delta types
- [x] 5.2 `reference/cli.adoc` — document the `diff` command and options
- [x] 5.3 `how-to/diff-versions.adoc` — guide for diffing two versions of a user's docs
