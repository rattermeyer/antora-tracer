## MODIFIED Requirements

### Requirement: Merge semantics match config-file `extends`
Preset inheritance SHALL use the same merge rules as a config file extending a preset: roles are unioned, relations are deep-merged by source and target role, matrices are overridden by `name`, and `labels` are overridden key-by-key.

#### Scenario: Child overrides parent
- **WHEN** a preset extends a parent and defines a role, relation, matrix, or label that the parent also defines
- **THEN** the child's value SHALL take precedence
