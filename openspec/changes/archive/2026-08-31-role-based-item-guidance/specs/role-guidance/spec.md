## ADDED Requirements

### Requirement: Role guidance is configurable per role
The traceability configuration SHALL support a `roleGuidance` section that maps a role name to a `page` (an AsciiDoc page path) and an optional `idPrefix`.

#### Scenario: config declares guidance for a role
- **WHEN** the config declares `roleGuidance.requirement.page` and `roleGuidance.requirement.idPrefix`
- **THEN** the extension SHALL accept and preserve both values for the `requirement` role

#### Scenario: idPrefix is optional
- **WHEN** the config declares `roleGuidance` with only a `page` and no `idPrefix`
- **THEN** the guidance SHALL resolve with the page and no idPrefix

### Requirement: Default guidance ships with presets
The extension SHALL ship default guidance AsciiDoc pages with the built-in presets, so a project that extends a preset receives guidance without authoring its own.

#### Scenario: preset provides default guidance
- **WHEN** a project extends the `requirements-engineering` preset and declares no `roleGuidance`
- **THEN** the `requirement` role SHALL resolve to the preset's shipped guidance page

#### Scenario: project overrides preset guidance
- **WHEN** a project extends a preset and declares its own `roleGuidance.requirement.page`
- **THEN** the project's page SHALL take precedence over the preset's shipped page

### Requirement: Guidance resolves through the extends chain
The `roleGuidance` section SHALL merge through the preset `extends` chain the same way `relations` does, with the more-derived config overriding the base.

#### Scenario: merged guidance across two levels
- **WHEN** a preset defines `roleGuidance.requirement` and a project config defines only `roleGuidance.design`
- **THEN** the resolved guidance SHALL include both `requirement` (from the preset) and `design` (from the project)

### Requirement: CLI resolves and reports guidance
The CLI SHALL provide a `role-guidance <role>` command that resolves the guidance through the `extends` chain and reports the resolved page path and `idPrefix`.

#### Scenario: resolved guidance for a known role
- **WHEN** `antora-tracer role-guidance requirement` runs against a project extending `requirements-engineering`
- **THEN** the output SHALL include the resolved page path and the `REQ` idPrefix

#### Scenario: role without guidance
- **WHEN** `antora-tracer role-guidance` runs for a role that has no `roleGuidance` entry anywhere in the chain
- **THEN** the command SHALL report that no guidance exists for that role

### Requirement: Guidance renders into the site
The extension SHALL register the resolved guidance pages into the content catalog at build time so they render in the consuming site.

#### Scenario: default guidance page is rendered
- **WHEN** a project builds with a preset that ships default guidance
- **THEN** the guidance page SHALL be available in the generated site without the project copying it into its own content sources

#### Scenario: project override page renders instead
- **WHEN** a project declares its own `roleGuidance` page
- **THEN** the project's page SHALL be the one rendered for that role

### Requirement: idPrefix is a fallback, not an authority
The `idPrefix` reported by the CLI SHALL be treated as advisory: it is a fallback for when the existing project content does not establish a convention, and it SHALL NOT override an established prefix.

#### Scenario: reported idPrefix is advisory
- **WHEN** the CLI reports `idPrefix: REQ` but the project's items already use a different prefix
- **THEN** a consumer SHALL follow the project's established prefix, not the reported one
