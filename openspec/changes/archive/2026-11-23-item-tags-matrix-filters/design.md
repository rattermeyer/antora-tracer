## Context

See `proposal.md` for motivation and `specs/item-metadata-filtering/spec.md` for the behavior contract. `Item.status` is already free-form; unrecognized header attributes are currently retained as string metadata, and matrix row selection currently uses role and supersession state.

## Goals / Non-Goals

**Goals:**
- Represent tags as a normalized list on each parsed item while preserving unrelated custom attributes.
- Apply row filtering after the existing current-items-by-role selection, preserving supersession behavior.
- Reject unsupported expression syntax during configuration validation; never execute configuration expressions as code.

**Non-Goals:**
- Filter matrix columns or change coverage/link semantics.
- Restrict the set of status values or change status lifecycle behavior.
- Add a general-purpose expression language or external parser dependency.

## Decisions

### Store tags as a dedicated item field

Parse the comma-delimited `tags` header value using the existing quote-aware attribute parser, trim entries, and omit empty entries. Remove `tags` from generic `attributes` after parsing. This gives membership checks a stable list contract; treating tags as generic text would force every filter consumer to reinterpret delimiters.

### Use a small allowlisted filter grammar

Add an optional `rowFilter` string to matrix definitions. Support comparisons of `status` against quoted string literals with `==` and `!=`, tag membership in the form `'tag' in tags` and its negation, combined with `and`, `or`, and parentheses. Parse the expression with a small tokenizer/parser or equivalent explicit grammar and evaluate only its supported nodes against an item. Do not use `eval` or accept property access, calls, or arbitrary operators. Report invalid expressions with the matrix name through config validation.

This is narrower and safer than adopting Sphinx-Needs' Python expressions, and sufficient for status/tag selection without a dependency.

### Filter only matrix rows

Apply the parsed predicate to current row-role items before row construction. Keep column-role item sets and relationship coverage untouched. With no `rowFilter`, the existing row selection path stays the same.

## Risks / Trade-offs

- [Expression syntax can be misunderstood] -> Document exact operators and examples in matrix configuration reference; test valid and invalid expressions.
- [Tags as a comma-delimited header value cannot represent an individual tag containing a comma] -> Treat comma as the delimiter; this matches the established header parser and the documented requirement.
- [Invalid filters discovered during generation could otherwise hide as empty results] -> Validate configured expressions before use and identify the offending matrix in the error.

## Migration Plan

No data migration is required. Existing item headers and matrix definitions remain valid; absent tags map to an empty list and absent row filters preserve current output. Rollback consists of removing the `tags` header attributes and `rowFilter` config entries.
