## Context

See `proposal.md` for motivation and the delta specs for observable behavior.

Relationship macro expansion currently enumerates outgoing and incoming edges separately, using the configured inverse type for incoming links. `MatrixGenerator` collects row-to-column and column-to-row edges, applies `coverageRelations`, and computes coverage from populated cells. `Item.attributes` already carries string-valued item metadata.

During `contentClassified`, pages and partials are expanded separately. A partial's macro output is prepared once before Asciidoctor includes it, so resolving only the partial file's attributes cannot honor different policies on different including pages.

## Goals / Non-Goals

**Goals:**
- Share one policy model and matcher between rendered item links and explicitly opted-in matrices.
- Match the relation and both endpoints independently of authored edge direction.
- Apply the including page's policy to relationships rendered from its partials.
- Preserve current output when no policy is selected.

**Non-Goals:**
- Change graph storage, relationship validation, queries, or exports.
- Apply a page's policy to matrices implicitly; each matrix opts in because filtering changes coverage.
- Add a general expression language or a first-class item-level field.

## Decisions

### Named policies are declarative configuration

Add a `linkDisplayPolicies` map to `TraceabilityConfig`. Each policy contains a `hide` list; each rule names a relation type and conditions for `currentItem` and `relatedItem`. Matchers support an optional role and exact string-valued item attributes, allowing projects to use their own levels and apply a rule across roles when role conditions are omitted. All conditions in one rule are ANDed; any matching rule hides the relationship.

For example:

```yaml
linkDisplayPolicies:
  l2-refinement-detail:
    hide:
      - relation: refined_by
        currentItem:
          attributes:
            abstraction-level: L2
        relatedItem:
          attributes:
            abstraction-level: L3
```

Interpret the relation type from the `currentItem` perspective before matching: use the edge type when the current item is its source, and its configured inverse when the current item is its target. This keeps the rule stable when the relationship is authored in either direction.

### One evaluator serves both output surfaces

Use a shared, pure matcher after candidate relationships are collected and before output grouping or cell insertion. For item macros, the enclosing item is `currentItem`. For matrices, the row item is `currentItem` and the candidate cell item is `relatedItem`.

Add optional `MatrixDefinition.linkDisplayPolicy`. Existing `coverageRelations` continues to restrict eligible relation types; the display policy adds an endpoint-aware exclusion. Filtered cell items are omitted before coverage is calculated, so they do not contribute to coverage. Without this matrix option, matrices remain unchanged.

### AsciiDoc selects the item-page policy

Use `traceability-link-policy` to select a named policy. An absent value means no filtering; `none` explicitly disables an inherited policy. Site and component values provide defaults, and a page-header value takes precedence for all items rendered in that page. Matrix policies remain selected in matrix configuration, not by page attributes.

### Partial macros render in the including page's policy context

Keep graph collection and macro expansion in the existing `contentClassified` pass. For page-authored items, expand using the page's resolved policy directly. For partials, generate guarded output variants for each configured policy, plus an unfiltered variant for an absent or `none` selector. Use standard AsciiDoc `ifeval` conditionals on `traceability-link-policy`; Asciidoctor evaluates them after including the partial, using the including page's attributes. One partial can therefore be included by pages with different policies without changing graph relationships or duplicating partial files.

Validate policy definitions while loading extension configuration. Validate site/component/page policy references during content processing and matrix references during configuration loading; unknown names fail with a diagnostic naming the policy and its source.

## Risks / Trade-offs

- Partial output size grows with configured policy count → emit variants only for configured policies and keep the policy set small; revisit conversion-time expansion if sites accumulate many policies.
- A selected matrix policy changes both cell contents and coverage → matrix use is opt-in and documented separately from page rendering.
- Relation names can be ambiguous across edge direction → normalize with configured inverse types before matching; do not filter by raw stored edge type.

## Migration Plan

No migration is required. Existing configurations select no policy and retain current rendering and matrix output. Add policy definitions and selectors only where filtering is wanted.
