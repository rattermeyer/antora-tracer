## 1. Characterize the existing scanners before changing anything

- [x] 1.1 Add a comparison test that runs the parser's `extractBlock`, the CLI's `extractItemBlock`, and the extension's `findItemBlocks` over the same fixtures and records where their bounds disagree: indented delimiter lines, EOF-closed blocks, class-prefixed headers, headers inside verbatim fences, headers with a `]` inside a quoted title.
- [x] 1.2 Record which disagreements real content depends on: scan the example site for indented `--` delimiter lines inside item blocks, and for item blocks without a trailing newline after the closing delimiter.
- [x] 1.3 Decide from 1.1 and 1.2 whether the CLI adopts the parser's delimiter rule; record the decision in `design.md` if it needs a rationale.

## 2. Implement the shared accessor

- [x] 2.1 Add a shared block-locating function that takes content plus a header offset and returns `ItemBlockBounds` (header, body, closing-delimiter offsets, delimiter form, item ID, derived 1-based start and end lines).
- [x] 2.2 Add a line-taking form that resolves a 1-based source line to the header offset and calls the offset form.
- [x] 2.3 Reuse the parser's header scan (quote-aware closing `]`, class-prefix form, line-start anchoring) and its delimiter scan (`/\n(====|--)\n/` opening, `/\nDELIM(?:\n|$)/` closing, EOF-closed accepted) so there is one grammar.
- [x] 2.4 Make the parser's own `extractBlock` and `extractBody` use the same scan, so the parser and the accessor cannot diverge.
- [x] 2.5 Export the accessor and the `ItemBlockBounds` type from `src/index.ts`.

## 3. Move consumers

- [x] 3.1 Replace `extractItemBlock` (`src/cli.ts:258`) with a caller of the shared accessor; keep `archive` and `remove` behaviour identical, including the refusal to change anything when the block is not found.
- [x] 3.2 Fold in `findItemBlocks` (`src/antora-extension.ts:441`) where it agrees with the parser; where it does not, record the divergence and identify its callers before deciding to fold or defer.
- [x] 3.3 Leave the `vscode-extension` branch untouched; note in the change that its fourth scanner becomes redundant.

## 4. Verify

- [x] 4.1 Assert bounds for every item of the example site: header, body, and closing-delimiter offsets reconstruct the block text exactly, and `bodyText` is byte-identical to the item's `content` where the block has non-empty body.
- [x] 4.2 Assert no bounds for an item-shaped header inside a `----` listing block, for a header not followed by a delimiter, and for an unterminated block.
- [x] 4.3 Assert the class-prefixed header case (`[.tracer#REQ-001, item, ...]`) and the quoted-`]` title case.
- [x] 4.4 Run `test/item-lifecycle.test.ts` unchanged: `archive` and `remove` still pass.
- [x] 4.5 Confirm `Item.content` is unchanged for every item of the example site, and that relationship lines are unaffected.
- [x] 4.6 Run the production build and the full suite.

## 5. Documentation and consistency

- [x] 5.1 Add the accessor to `reference/api.adoc` (the consistency table in `AGENTS.md` requires an API change to be documented in the same change).
- [x] 5.2 Update `explanation/processing-pipeline.adoc` or `explanation/architecture.adoc` if either describes block location per consumer; the ARC item describing block-boundary scanning needs its `addresses:` links checked.
- [x] 5.3 Update `CHANGELOG.md`.
- [x] 5.4 Sync the delta spec to `openspec/specs/item-block-bounds/spec.md` before archive.
