## MODIFIED Requirements

### Requirement: Overview page generation is opt-in and configurable
When `generateOverview` is enabled, the system SHALL register the overview as a content-catalog attachment at the configured `overviewTarget` (default `traceability/overview.html`), reporting supersession statistics and dangling references.

#### Scenario: Overview is registered as a navigable attachment
- **WHEN** `generateOverview` is true
- **AND** `overviewTarget` is `traceability/overview.html`
- **THEN** the build SHALL register the overview at `attachment$traceability/overview.html`

#### Scenario: Custom target is honored
- **WHEN** `overviewTarget` is `reports/supersession.html`
- **THEN** the build SHALL register the overview at `attachment$reports/supersession.html`

#### Scenario: Disabled means no overview
- **WHEN** `generateOverview` is false
- **THEN** no overview SHALL be generated or registered
