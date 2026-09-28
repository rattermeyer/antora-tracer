## MODIFIED Requirements

### Requirement: Opt-in via AsciiDoc attribute
The system SHALL use the resolved `:traceability-links:` attribute to determine whether relationship links are rendered. When the attribute is truthy, the system SHALL render combined outgoing and incoming relationships for every item in the page and for items defined in partials according to the partial's component-level attribute. A page-level attribute SHALL override the component-level attribute for items authored in that page. An including page's attribute SHALL NOT override the component-level attribute for items defined in a partial. When the attribute is absent or falsy, explicitly authored relationship rendering macros SHALL be stripped from rendered output, preserving existing behavior.

#### Scenario: Attribute set to true
- **WHEN** `:traceability-links:` resolves to true for a page containing items without relationship rendering macros
- **THEN** each such item renders its outgoing and incoming relationship links

#### Scenario: Attribute not set
- **WHEN** `:traceability-links:` is absent or resolves to false for a page containing items without relationship rendering macros
- **THEN** the system SHALL NOT add automatic relationship links to those items

#### Scenario: Explicit rendering macro prevents duplicate automatic output
- **WHEN** link rendering is enabled and an item contains `traceability:links[]`, `traceability:outgoing[]`, or `traceability:incoming[]`
- **THEN** the system SHALL preserve and expand the explicitly authored macro or macros
- **AND** the system SHALL NOT add automatic combined output to that item

#### Scenario: Component setting governs items defined in partials
- **WHEN** a partial defines an item and the component's `:traceability-links:` attribute is truthy
- **THEN** the item renders combined outgoing and incoming relationship links when included in a page
- **AND** the partial does not need its own `:traceability-links:` attribute

#### Scenario: Including page setting does not override partial component setting
- **WHEN** a page includes a partial and its page-level `:traceability-links:` value differs from the partial's component-level value
- **THEN** automatic relationship rendering for items defined in the partial follows the partial component's value

#### Scenario: Explicit macro is stripped when disabled
- **WHEN** `:traceability-links:` is absent or falsy and an item contains an explicit relationship rendering macro
- **THEN** the system strips the macro from rendered output and adds no automatic relationship links
