## MODIFIED Requirements

### Requirement: Configuration graph via traceability:config-graph[] macro
The scenario describing the config graph SHALL use a `relations` `reverse` declaration instead of an `inverseLabels` map: `relations` declares `design` to `requirement` with relation `addresses` and reverse `addressed_by`.

#### Scenario: Config graph uses the reverse declaration
- **WHEN** `relations` declares `design` to `requirement` with relation `addresses` and reverse `addressed_by`
- **THEN** the config graph renders the declared `addresses` edge without deriving `addressed_by` edges
