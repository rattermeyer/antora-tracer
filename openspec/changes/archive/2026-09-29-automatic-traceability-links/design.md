## Context

See `proposal.md` for motivation and `specs/traceability-links-macro/spec.md` for the behavior contract.

The extension currently builds the graph from all page and partial files before expanding relationship rendering macros. Pages resolve `traceability-links` from component attributes with a document-header override. Partials are expanded separately and currently force link rendering on because they have no page header; their component attributes are available through the content catalog.

## Goals / Non-Goals

**Goals:**
- Reuse the existing combined relationship output, style, ordering, and empty-state logic for automatic rendering.
- Resolve enablement independently for each page or partial from its own component attributes and, for pages, its own header.
- Preserve explicitly authored direction and placement, avoiding automatic duplicate output within that item.

**Non-Goals:**
- Determine whether a partial is included by a particular page or inherit that page's header settings. Partials use their component-level setting.
- Change relationship collection, graph semantics, or xref resolution.

## Decisions

### Append generated output at the end of each enabled item

For enabled content, locate item block bodies after the graph is complete. Append combined outgoing/incoming output immediately before the item's closing delimiter, using the existing link-rendering options and generator. This covers page items and partial items without needing to discover include relationships or mutate content separately for each including page.

An item with any explicit `links`, `outgoing`, or `incoming` rendering macro is handled by the existing macro expansion path and receives no automatic combined output. This preserves authors' chosen direction and placement while preventing duplicate link lists.

Alternative: require authors to add a new macro to each item. Rejected because it preserves the repetition this change removes.

### Resolve partial enablement from the partial component

Use the existing resolved attribute mechanism for both pages and partials. Pages combine component attributes with document headers; partials have no header override and use their component attributes. Remove the unconditional partial enablement for relationship macros; retain separate graph macro behavior unless separately required.

Alternative: propagate an including page's setting to partials. Rejected because include relationships and per-page overrides are not available during the current content-classified pass, and one partial may be reused by pages with conflicting settings.

### Preserve current explicit macro behavior

Continue expanding authored rendering macros only when link rendering resolves enabled. When disabled, keep the existing behavior: strip explicit relationship rendering macros from rendered output. Automatic combined output applies only to enabled content and only to items with no explicit relationship rendering macro.

## Risks / Trade-offs

- Component-level behavior on partials may differ from a page header that includes them → document the precedence and verify with a partial included from pages with conflicting headers.
- Generated links for items with no relationships follow the configured empty-state behavior → reuse the existing `traceability-empty` handling rather than invent a separate automatic-rendering policy.
- Existing examples that combine page-level opt-in and explicit macros would receive no visible change after moving enablement to component scope → remove redundant page attributes and retain explicit macros until consumers choose automatic placement.

## Migration Plan

No breaking migration. Existing pages with a truthy attribute and explicit macros continue to use those macros without duplicate automatic output. Sites can move repeated page attributes to component or playbook attributes to enable link rendering more broadly. Rollback by removing the automatic insertion path; existing authored macros remain supported.
