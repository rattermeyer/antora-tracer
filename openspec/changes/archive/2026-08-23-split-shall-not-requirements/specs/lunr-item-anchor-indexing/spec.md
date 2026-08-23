## MODIFIED Requirements

### Requirement: Item indexing is scoped to article body
The item anchor indexing SHALL traverse only elements within `<article class="doc">`.

#### Scenario: Indexing is scoped to the article
- **WHEN** item anchor indexing runs
- **THEN** elements outside `<article class="doc">` SHALL NOT be indexed
