# Design: Add use-case role to example site

## Decision
Add a `use_case` role to the self-traceability example by extending the `self-traceability` preset via `examples/traceability.yml`. The use cases describe real workflows for the extension itself (authoring items, defining config, running CLI, using partials, browsing matrices) and trace into existing requirements.

## Role and relations

```yaml
roles:
  - requirement
  - design
  - test
  - use_case

relations:
  use_case:
    requirement: [leads_to]
```

Directional: `use_case --leads_to--> requirement` is valid. `requirement --leads_to--> use_case` is NOT valid — this exercises REQ-014.

## Items

Five use-case items (UC-001 through UC-005) placed in a new `use-cases.adoc` page:

| ID | Title | Traces into |
|----|-------|-------------|
| UC-001 | Author writes traceable items in AsciiDoc | REQ-001, 002, 003, 004 |
| UC-002 | Author defines custom domain model | REQ-006, 007, 008, 012 |
| UC-003 | Author runs CLI to get next available ID | REQ-056 |
| UC-004 | Author organizes items in partials | REQ-059 |
| UC-005 | Reader browses traceability matrices | REQ-029, 037, 038 |

## Matrix

```yaml
matrices:
  - name: usecase-requirements
    rows: use_case
    columns: [requirement]
    coverageRelations:
      requirement: [leads_to]
```

## Nav

Insert Use Cases after Requirements in the main nav:

```
* xref:index.adoc[Overview]
* xref:requirements.adoc[Requirements]
* xref:use-cases.adoc[Use Cases]
* xref:architecture.adoc[Architecture]
...
```

## Compatibility
No breaking changes. Existing matrices and items are unaffected. The `use_case` role is additive.
