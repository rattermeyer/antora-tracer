## Context

See `proposal.md` for the motivation and the delta specs for the observable contract.

List output is grouped by relationship type in `generateListStyle`. With collapsible enabled, that method currently wraps each group separately. `buildRelationMacroOutput` combines outgoing groups followed by incoming groups for `links`, so a single outer block can naturally contain both directions while retaining group headings.

## Goals / Non-Goals

**Goals:**
- Keep relation-type headings and links intact inside one disclosure.
- Use the same output for automatic links and explicit `links[]` rendering.
- Preserve separate directional macro behavior, non-collapsible formatting, and table/inline styles.

**Non-Goals:**
- Change which relationships or inverse labels are displayed.
- Add configuration or alter the meaning of `:traceability-collapsible:`.

## Decisions

### Wrap the complete list once

When collapsible list output is requested and groups exist, emit one `[%collapsible]` block titled `Links`, then emit each relationship type as a normal titled list section inside it. Do not emit nested collapsible blocks for the individual groups. When disabled, retain the existing flat output.

This belongs in the list formatter, not in each macro caller: automatic and explicit combined output share the formatter, and each direction continues to reuse it. Table and inline styles already bypass list formatting and remain unchanged.

Alternative: wrap the output after generating separate per-group disclosure blocks. Rejected because it nests interactive disclosures and requires parsing or restructuring generated AsciiDoc.

### Keep the disclosure only when links exist

Create the outer `Links` block only when at least one relationship group is present. Empty-state messages remain handled by the existing macro-output logic, rather than showing an empty disclosure container.

## Risks / Trade-offs

- AsciiDoc section headings inside an open block could render differently across converters → verify generated HTML for multiple groups and both directions.
- Explicit `outgoing[]` and `incoming[]` produce their own single-direction `Links` blocks when collapsible → the behavior is consistent per macro invocation; combined `links[]` produces one block containing both directions.

## Migration Plan

No migration is required. The existing boolean attribute and authored content remain valid; the output changes only for list style with collapsible enabled. Reverting the formatter restores one collapsible block per relation type.
