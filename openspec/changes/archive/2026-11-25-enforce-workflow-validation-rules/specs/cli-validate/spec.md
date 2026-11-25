## MODIFIED Requirements

### Requirement: CLI exposes a validate command
The CLI SHALL provide a `validate` command that reads AsciiDoc source files (via `-i/--input`) and the traceability configuration (via `--config`) and reports validation errors.
No Antora build SHALL be required.

#### Scenario: Valid input reports no errors
- **WHEN** user runs `antora-tracer validate -i docs/ --config traceability.yml` on a site with no invalid relationships
- **THEN** the command reports no validation errors
- **AND** exits with code 0

#### Scenario: Invalid relation type is reported
- **WHEN** a relationship uses a relation type that is not configured for the source-target role pair
- **THEN** the command reports it as an error naming the source and target item IDs with roles, the invalid relation type, and the list of allowed alternatives
- **AND** exits with a non-zero code

#### Scenario: Dangling reference is reported
- **WHEN** a relationship references a target item that does not exist
- **THEN** the command reports it as an error naming the file, line, and the missing target
- **AND** exits with a non-zero code

#### Scenario: Circular reference is reported
- **WHEN** the graph contains a cycle, including a self-referencing relationship
- **THEN** the command reports the circular reference
- **AND** exits with a non-zero code

#### Scenario: Duplicate item ID is reported
- **WHEN** the same item ID is defined more than once, whether the repeated definitions are in one file or across files
- **THEN** the command reports it as an error naming the duplicate ID and the file and line of both definitions
- **AND** exits with a non-zero code

#### Scenario: Unmet workflow requirement is reported
- **WHEN** the configuration declares `validation.<role>.<status>.requiresRoles`
- **AND** an item has that role and status but has no relationship to an item of a required role
- **THEN** the command reports it as an error naming the item, its role and status, and the required role
- **AND** exits with a non-zero code

#### Scenario: Satisfied workflow requirement passes
- **WHEN** an item's status matches a configured rule
- **AND** the item has a relationship, in either direction, to an item of each required role
- **THEN** the command reports no error for that item

### Requirement: Workflow validation rules are enforced
The validation SHALL enforce the `validation.<role>.<status>.requiresRoles` rules declared in the configuration, for every consumer of the graph's validation — the CLI command and the Antora build alike.

#### Scenario: A relation from either endpoint satisfies the rule
- **WHEN** an item's status matches a rule requiring another role
- **AND** the relationship to that role is authored from the other item
- **THEN** the rule SHALL be satisfied

#### Scenario: An item with no status is not gated
- **WHEN** an item has no status
- **THEN** no workflow rule SHALL apply to it

#### Scenario: A relation to an item of a different role does not satisfy the rule
- **WHEN** an item has a relationship only to items whose role is not the required role
- **THEN** the rule SHALL be reported as unmet

#### Scenario: Configuration rejects a rule naming an undeclared role
- **WHEN** the configuration's `validation` block names a role, or a `requiresRoles` entry names a role, that is not declared in `roles`
- **THEN** configuration loading SHALL fail with an error naming the offending role
