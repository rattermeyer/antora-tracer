## ADDED Requirements

### Requirement: Incoming macro supports collapsible output
The system SHALL apply the same `:traceability-collapsible:` document attribute to `traceability:incoming[]` output as it does for `traceability:outgoing[]`. When enabled, each inverse relation-type group in list-style incoming output SHALL be wrapped in a `[%collapsible]` block.

#### Scenario: Collapsible enabled for incoming macro
- **WHEN** `:traceability-collapsible: true` and an item block contains `traceability:incoming[]`
- **THEN** each incoming relation-type group renders as a `[%collapsible]` block with the inverse type label as the title

#### Scenario: Collapsible disabled for incoming macro
- **WHEN** `:traceability-collapsible:` is absent and an item block contains `traceability:incoming[]`
- **THEN** incoming output renders as flat blocks (existing behavior)
