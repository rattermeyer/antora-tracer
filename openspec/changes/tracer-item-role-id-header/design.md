## Context

See `proposal.md` for motivation and `specs/item-header-syntax/spec.md` for the observable contract.

Today the existing `[#ID, item, ...]` prefix is matched independently in `DocumentParser`, Antora item-block discovery and transforms, supersession stripping, and CLI item-block location. Asciidoctor accepts `[.tracer#ID, item, ...]` and renders both the ID anchor and `tracer` class, but the project scanners do not recognize that prefix.

## Goals / Non-Goals

**Goals:**
- Add the exact `[.tracer#ID, item, ...]` spelling without changing the existing spelling.
- Keep all item-aware passes consistent about recognizing both spellings.
- Preserve the new AsciiDoc role and anchor through the in-memory rendering pipeline.

**Non-Goals:**
- Add arbitrary user-defined role/ID header combinations.
- Change item roles, CSS, or backend-specific styling.
- Rewrite existing item headers in project content.

## Decisions

### Recognize two explicit header prefixes

Update each item-header recognizer to accept either `[#ID, item, ...]` or `[.tracer#ID, item, ...]`, extracting the same ID. Keep the accepted new form limited to `.tracer` before the anchor rather than broadening the grammar to arbitrary role-plus-ID combinations; the latter adds unrequested syntax and ambiguous interactions with item roles.

### Preserve the authored new header during rendering

Leave `[.tracer#ID, item, ...]` intact in the source buffer except for existing title and indentation transformations. Asciidoctor already maps the combined role-and-ID attribute to the intended block class and anchor. Do not reconstruct or normalize the header in a way that drops `.tracer`.

### Update every item-aware path

Apply the syntax to `DocumentParser`, Antora block discovery and macro processing, unindent/title/supersession transforms, and CLI block location. Keep verbatim-range checks and current delimiter semantics unchanged. Test the forms through core parsing, Antora transformations, and CLI lifecycle block lookup rather than introducing a shared parser abstraction solely for two forms.

### Document the new form as an alternative

Update the existing item macro reference with both forms and explain that the `.tracer` role is emitted as a CSS class while the ID remains the block anchor. Existing examples and default syntax remain unchanged.

## Risks / Trade-offs

- **A recognizer is missed** → Audit every current item-header matching site and cover related macro rendering and lifecycle behavior in targeted tests.
- **Header rewriting drops the role or anchor** → Keep the authored role/ID combination and verify rendered HTML includes both the `tracer` class and ID.
- **Broader role-plus-ID syntax is expected accidentally** → Document and test only the explicit `.tracer#ID` form; arbitrary roles are outside this change.

## Migration Plan

No migration is required. Existing headers remain valid; users may adopt the alternative form where they need a CSS selector for tracer items. Reverting the change leaves existing headers unaffected; new-form headers would no longer be recognized by older versions.
