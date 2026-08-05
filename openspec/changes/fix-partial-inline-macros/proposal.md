## Why

Macros in AsciiDoc partial files appear as raw text in rendered HTML output. Two examples from `04-solution-strategy.adoc` (included in `architecture.adoc`): `addresses:QA-055[]` (inline relationship macro) and `traceability:links[]` (rendering macro). Both survive unprocessed because the `contentClassified` handler deliberately skips partial files during Pass 2 (macro expansion) and Pass 3 (link substitution).

The `partial-file-processing` spec states these passes are skipped "since partials do not produce rendered HTML output." This assumption is incorrect — partials are inlined into pages by Asciidoctor via `include::partial$` and their content reaches the browser. Inline macros are invisible data markers that should always be stripped, and rendering macros in partials produce relationship lists for the partial's own items (which are different from the page's items, so no duplication occurs).

## What Changes

- Add `partialFilesForVersion` to both the Pass 2 loop (macro expansion) and Pass 3 loop (link substitution) in `contentClassified`
- Update the `partial-file-processing` main spec: Pass 2 and Pass 3 are now applied to partials

## Capabilities

### Modified Capabilities

- `partial-file-processing`: Both macro expansion (Pass 2) and link substitution (Pass 3) are now applied to partial files alongside pages. Pass 2 expands `traceability:outgoing[]`/`incoming[]`/`links[]` rendering macros in partials. Pass 3 strips inline macros in partials.

## Impact

- `src/antora-extension.ts` — add `partialFilesForVersion` to Pass 2 and Pass 3 loops
- `openspec/specs/partial-file-processing/spec.md` — updated requirement and scenarios
- No test changes needed
