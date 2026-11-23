## MODIFIED Requirements

### Requirement: Default guidance ships with presets
The extension SHALL ship default AsciiDoc authoring guidance for every role declared by every built-in preset. Guidance SHALL describe the role's purpose, provide an applicable item template or explain when a template is not applicable, and give role-specific writing and review criteria. Guidance SHALL use only relationship directions, target roles, lifecycle states, and ID-prefix conventions supported by the preset or project configuration. When role semantics are not established, guidance SHALL ask authors to follow project conventions or clarify them rather than inventing behavior or implying compliance.

#### Scenario: every built-in preset role resolves authoring guidance
- **WHEN** a user resolves authoring guidance for any role declared by a built-in preset
- **THEN** the resolved preset SHALL provide an AsciiDoc guidance page for that role

#### Scenario: preset provides default guidance
- **WHEN** a project extends the `requirements-engineering` preset and declares no `roleGuidance`
- **THEN** the `requirement` role SHALL resolve to the preset's shipped guidance page
- **AND** the page SHALL state the role's purpose and give applicable authoring and quality advice

#### Scenario: role guidance matches preset traceability
- **WHEN** guidance describes a relationship, lifecycle state, or ID prefix for a role
- **THEN** the described relationship and state SHALL be declared by the relevant preset configuration
- **AND** an ID prefix SHALL be included only when established by the preset or existing project convention

#### Scenario: guidance avoids unsupported compliance claims
- **WHEN** a preset is intended for a regulated or standards-based domain
- **THEN** its guidance SHALL describe authoring and traceability practices without claiming that using the preset alone establishes regulatory or standards compliance

#### Scenario: project overrides preset guidance
- **WHEN** a project extends a preset and declares its own `roleGuidance.<role>.page`
- **THEN** the project's page SHALL take precedence over the preset's shipped page
