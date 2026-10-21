## Purpose

Named relationship display policies let projects hide selected links at one endpoint's view while preserving the relationship in the graph and allowing other output surfaces to opt into the same rule.

## ADDED Requirements

### Requirement: Policies match normalized relation types and both endpoints
The configuration SHALL support named link display policies containing one or more hide rules. Each rule SHALL identify a relation type and conditions for the item being displayed and the related item. A condition MAY match the item's role and/or string-valued attributes. All conditions in one rule SHALL match for that rule to hide a link; a link SHALL be hidden when any rule in the selected policy matches. Relation types SHALL be interpreted from the displayed item's perspective using configured inverse types, so matching SHALL NOT depend on which direction authored the relationship. A hide rule SHALL affect display only and SHALL NOT alter or remove the graph relationship.

#### Scenario: Hide an L2-to-L3 refinement only on the L2 item
- **WHEN** a selected policy hides `refined_by` when the displayed item's `abstraction-level` is `L2` and the related item's `abstraction-level` is `L3`
- **AND** the relationship is authored in either endpoint direction
- **THEN** the link SHALL be omitted from the L2 item's rendered links
- **AND** the L3 item's link to L2 SHALL remain visible
- **AND** the graph relationship SHALL remain intact

#### Scenario: Apply a level rule across roles
- **WHEN** a policy matches endpoint attributes but specifies no role conditions
- **AND** the endpoints have different roles
- **THEN** the rule SHALL match regardless of those roles

#### Scenario: Preserve a nonmatching relationship
- **WHEN** a selected policy has no hide rule matching a relationship and its endpoints
- **THEN** the relationship SHALL remain visible in that output

#### Scenario: No policy preserves current output
- **WHEN** no link display policy is selected
- **THEN** relationship output SHALL remain unfiltered

### Requirement: Matrices may opt into a link display policy
A matrix definition MAY select a configured link display policy by name. For policy evaluation, the matrix row item SHALL be the displayed item and each candidate cell item SHALL be the related item. A matching relationship SHALL be omitted from the cell and SHALL NOT count toward matrix coverage. Existing column relation filters SHALL continue to apply. A matrix with no selected policy SHALL preserve its current behavior.

#### Scenario: Filtered relationship is omitted from a matrix cell
- **WHEN** a matrix selects a policy that hides a relationship between its row item and a candidate cell item
- **THEN** the cell SHALL omit that item
- **AND** the filtered relationship SHALL NOT count toward coverage

#### Scenario: Reverse row and cell levels remain visible
- **WHEN** a matrix selects a policy that hides links from an L2 row item to an L3 cell item
- **AND** a row item is L3 and its related cell item is L2
- **THEN** the L3-to-L2 relationship SHALL remain in the cell and count toward coverage when it satisfies the column's relation filter

### Requirement: Unknown policy references are rejected
The system SHALL report an actionable configuration error when a site, component, or page AsciiDoc attribute, or a matrix definition, references a link display policy that is not defined.

#### Scenario: Unknown document policy
- **WHEN** a site, component, or page `traceability-link-policy` attribute names an undefined policy
- **THEN** the build SHALL report an error identifying the unknown policy

#### Scenario: Unknown matrix policy
- **WHEN** a matrix names an undefined link display policy
- **THEN** configuration loading SHALL report an error identifying the matrix and policy
