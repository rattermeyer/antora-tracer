## Purpose

Export allocator seed values — the next numeric ID per prefix — so the standalone ID allocation server can be initialized to continue from a team's existing local IDs instead of colliding at `001`.

## ADDED Requirements

### Requirement: seed reports the next numeric ID per prefix
The CLI SHALL provide a `seed` command that scans items and, for each ID prefix found, reports the numeric value one greater than the highest existing suffix.

#### Scenario: max+1, not max, not formatted
- **WHEN** the scanned items contain `REQ-054` as the highest `REQ` ID
- **THEN** the seed output reports `start: 55` for prefix `REQ` (a number, not `54` and not the string `REQ-055`)

#### Scenario: multiple prefixes
- **WHEN** the scanned items contain `REQ-054` and `ARC-012`
- **THEN** the output reports `REQ` with `start: 55` and `ARC` with `start: 13`

#### Scenario: no items for a prefix
- **WHEN** no scanned item matches a given prefix
- **THEN** that prefix is absent from the output

### Requirement: seed output matches the allocator seed format
The seed output SHALL be a YAML `prefixes` map whose entries carry a numeric `start`, directly consumable as the id-server's `prefixes` configuration.

#### Scenario: output shape
- **WHEN** the seed command writes a file
- **THEN** the file contains a top-level `prefixes:` map with one `start:` key per prefix

### Requirement: seed accepts a local directory or an Antora playbook
The `seed` command SHALL accept either `-i <dir>` to scan a single directory, or a playbook path to harvest every component and repository in that playbook.

#### Scenario: playbook mode spans repositories
- **WHEN** `antora-tracer seed antora-playbook.yml` is run against a playbook with components from multiple repositories
- **THEN** the reported maximum for each prefix includes items from all components

#### Scenario: version deduplication
- **WHEN** the same item `REQ-054` appears in two component versions
- **THEN** it contributes once to the maximum, so the seed for `REQ` is still `start: 55`

### Requirement: seed requires an input
The `seed` command SHALL require exactly one input — either `-i <dir>` or a playbook path — and SHALL exit with an error when neither is provided.

#### Scenario: missing input
- **WHEN** `antora-tracer seed` is run with neither `-i` nor a playbook path
- **THEN** the command exits with a non-zero code and an error message
