## ADDED Requirements

### Requirement: Selected policy filters rendered item relationships
When a link display policy is selected, the system SHALL apply it to all automatically generated and explicitly requested outgoing, incoming, and combined relationship links. For policy evaluation, the enclosing item SHALL be the displayed item and each linked item SHALL be the related item. The policy SHALL filter only matching links and SHALL NOT change relationship parsing or graph contents.

#### Scenario: Automatic links use the selected policy
- **WHEN** `traceability-links` enables automatic relationship links
- **AND** `traceability-link-policy` selects a policy that matches one relationship
- **THEN** the matching link SHALL be omitted
- **AND** other matching-direction relationships SHALL render normally

#### Scenario: Explicit direction macros use the selected policy
- **WHEN** an item contains `traceability:outgoing[]`, `traceability:incoming[]`, or `traceability:links[]`
- **AND** a link display policy is selected
- **THEN** the policy SHALL filter matching links in each macro's requested direction

### Requirement: Page policy overrides apply to included partial items
The system SHALL resolve `traceability-link-policy` from site and component defaults, with a page-header value taking precedence for every item rendered in that page, including items defined in included partials. The value `none` SHALL disable policy filtering for the page. If no policy is selected, the system SHALL preserve current unfiltered link output.

#### Scenario: Page policy overrides the component policy for a page item
- **WHEN** the page header selects a different link display policy from the component default
- **THEN** items authored in the page SHALL use the page policy

#### Scenario: Page policy overrides the partial component policy
- **WHEN** an included partial defines an item
- **AND** the including page selects a link display policy that differs from the partial's component default
- **THEN** the partial item's rendered links SHALL use the including page's policy

#### Scenario: Page disables an inherited policy
- **WHEN** the site or component selects a link display policy
- **AND** the page header sets `traceability-link-policy` to `none`
- **THEN** the page's item links SHALL render without policy filtering
