## 1. Confirm the harvest metadata

- [x] 1.1 Re-probe `harvestSiteFiles` on `antora-playbook.yml` and confirm, for a file in each of the three content sources (`examples/tracer`, `examples/demo`, `blog`), that `file.src.origin.worktree` and `file.src.origin.startPath` are present and that joining them with `file.src.path` yields an existing file.
- [x] 1.2 Record what a source without git metadata provides, so the "no root" branch is exercised by a real case rather than only a synthetic one.

## 2. Harvest the root

- [x] 2.1 Add the source root to `HarvestedFile` in `src/SiteGraph.ts`.
- [x] 2.2 Populate it in `harvestSiteFiles` from the file's origin metadata (repository location joined with the source's start path); leave it unset when that metadata is absent.
- [x] 2.3 Add a test that harvests a playbook with two sources sharing a relative path and asserts the two roots differ and each resolves to its own file.

## 3. Carry the root to items

- [x] 3.1 Add an optional source-root field to `Item` in `src/types.ts`.
- [x] 3.2 Pass the root through the item-building path used by `site-graph` and `seed` (`src/cli.ts:1653-1685`, `:1037-1075`).
- [x] 3.3 Leave items produced by the local, non-playbook parse path without a root, as specified.

## 4. Keep published artifacts clean

- [x] 4.1 Exclude the root from `serializeSnapshot` (`src/GraphSnapshot.ts:26-32`), alongside `pubUrl`, with the reason stated in the code comment.
- [x] 4.2 Assert that a serialized snapshot contains no source root and no absolute filesystem path, for a harvest of `antora-playbook.yml`.
- [x] 4.3 Assert that the extension's published `graph.json` payload has the documented field set and no absolute path.
- [x] 4.4 Assert a snapshot round-trips: serialize, deserialize, and confirm component, module, and version survive and the root is absent.

## 5. Resolution

- [x] 5.1 Make `resolveSourceFilePath` (`src/cli.ts:240-252`) prefer the item's recorded root and fall back to the command's input directory when no root is present.
- [x] 5.2 Keep the escape check: a resolved path outside the root is rejected, not read or written.
- [x] 5.3 Add a test for the escape rejection against a recorded root.

## 6. Verify end to end

- [x] 6.1 Harvest `antora-playbook.yml` and assert every item resolves to exactly one existing file, using the recorded root rather than a supplied input directory.
- [x] 6.2 Run `antora-tracer validate -i examples/tracer` and the lifecycle test file to confirm the fallback path is unchanged.
- [x] 6.3 Run the production build, the full suite, and the example-site Antora build.

## 7. Documentation and consistency

- [x] 7.1 Update `reference/api.adoc` for the new `Item` field and the `HarvestedFile` change.
- [x] 7.2 Update `reference/configuration.adoc` only if any configuration is affected; expected: no change.
- [x] 7.3 Update `CHANGELOG.md`.
- [x] 7.4 Sync both delta specs (the new capability and the modified `multi-source-diff` requirement) before archive.
