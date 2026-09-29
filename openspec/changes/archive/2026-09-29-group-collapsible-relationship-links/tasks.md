## 1. Group collapsible relationship output

- [x] 1.1 Wrap all list-style relation groups for an item in one `Links` disclosure when collapsible is enabled; verify multiple outgoing groups share one wrapper and retain their headings.
- [x] 1.2 Preserve combined incoming and outgoing output, and keep directional macros working; verify `links[]` has one wrapper containing both directions and `incoming[]` uses inverse labels.
- [x] 1.3 Preserve non-collapsible, table, inline, and empty-state behavior; verify existing style tests and empty relationship cases.

## 2. Documentation and integration

- [x] 2.1 Update macro reference and specifications to describe the single `Links` disclosure; verify wording matches generated output.
- [x] 2.2 Run focused collapsible tests and build the example site; verify HTML contains one disclosure per item with grouped relationship headings.
