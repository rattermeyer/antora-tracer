## MODIFIED Requirements

### Requirement: Incoming macro supports collapsible output
The system SHALL apply the `:traceability-collapsible:` document attribute to incoming list-style relationship output. When enabled, incoming relation-type groups SHALL appear inside the single `Links` collapsible block shared with any outgoing groups, and SHALL retain their inverse relation-type headings.

#### Scenario: Collapsible enabled for incoming macro
- **WHEN** `:traceability-collapsible: true` and an item renders `traceability:incoming[]` in list style
- **THEN** its incoming relation-type groups render inside the item's single `[%collapsible]` block titled `Links`
- **AND** each group uses the inverse relation label as its heading

#### Scenario: Collapsible disabled for incoming macro
- **WHEN** `:traceability-collapsible:` is absent or non-truthy and an item renders `traceability:incoming[]`
- **THEN** incoming output renders as flat blocks without a collapsible wrapper
