## 1. Reproduce and pin the defect

- [x] 1.1 Add a parser regression test with four cases, each asserting the relation's `line` equals the macro's file line: no leading blank line, one leading blank line, two leading blank lines, and a relation in a later item of a multi-item document. Confirm the test fails on the current implementation with deltas −1, −2, −3, −1.
- [x] 1.2 Add a case asserting that two relations on different body lines report two different lines.
- [x] 1.3 Add a case asserting a header-attribute relation still reports the header line, so the fix cannot silently move that path.

## 2. Thread the absolute body offset

- [x] 2.1 Make `extractBlock` return, or make separately available, the opening delimiter's absolute index in the source content (it already scans for it at `src/DocumentParser.ts:540-556`).
- [x] 2.2 Compute the body's absolute start in `parse` where the block is extracted (`src/DocumentParser.ts:214`), as delimiter index + delimiter length + 1.
- [x] 2.3 Pass the body absolute start into `parseInlineMacrosFromItems` (`src/DocumentParser.ts:132-136`).
- [x] 2.4 Replace the line expression at `src/DocumentParser.ts:455` with `this.lineAt(content, bodyAbsoluteStart + match.index)`.

## 3. Verify against real content

- [x] 3.1 Re-run the two-item probe: all four cases report their true lines.
- [x] 3.2 Re-measure the self-traceability example site: all body-authored relations report their macro's own line (401 of 401 previously one line early), and the header-attribute relations are unchanged.
- [x] 3.3 Confirm the exclusion checks still hold: a relation macro inside a listing block or a backtick span produces no relationship.
- [x] 3.4 Confirm `Item.content` is unchanged for every item of the example site, so the snapshot and `graph.json` payloads are unaffected.

## 4. Confirm the blast radius

- [x] 4.1 Confirm no existing test asserted a relationship `line` value and therefore none needs re-pinning.
- [x] 4.2 Run `antora-tracer validate -i examples/tracer` and confirm warnings name real macro lines.
- [x] 4.3 Run the focused parser and CLI test files, then the full suite.
- [x] 4.4 Run the production build (`pnpm run build`) and the example-site Antora build, then regenerate the golden-style snapshot comparison if the repository's harness expects it.

## 5. Documentation and consistency

- [x] 5.1 Scan the consistency table in `AGENTS.md`: whether `explanation/processing-pipeline.adoc` or `reference/api.adoc` describes relationship line derivation, and update any prose that states the old behaviour.
- [x] 5.2 Update `CHANGELOG.md` with the corrected reported positions.
- [x] 5.3 Sync the delta spec to `openspec/specs/source-position-fidelity/spec.md` before archive.
