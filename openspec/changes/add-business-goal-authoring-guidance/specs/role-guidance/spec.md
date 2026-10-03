## MODIFIED Requirements

### Requirement: Default guidance ships with presets
The extension SHALL ship default guidance AsciiDoc pages with the built-in presets, so a project that extends a preset receives guidance without authoring its own.

#### Scenario: preset provides default guidance
- **WHEN** a project extends the `requirements-engineering` preset and declares no `roleGuidance`
- **THEN** the `requirement` role SHALL resolve to the preset's shipped guidance page

#### Scenario: max preset provides business-goal guidance
- **WHEN** a project extends the `requirements-engineering-max` preset and declares no `roleGuidance`
- **THEN** the `business_goal` role SHALL resolve to shipped authoring guidance

#### Scenario: business-goal links are optional and point to goals
- **WHEN** a project uses the max preset's business-goal authoring guidance
- **THEN** the guidance SHALL describe links from downstream items to business goals as optional
- **AND** show the configured inverse relation `is_motivated_by` on a downstream item

#### Scenario: project overrides preset guidance
- **WHEN** a project extends a preset and declares its own `roleGuidance.requirement.page`
- **THEN** the project's page SHALL take precedence over the preset's shipped page
