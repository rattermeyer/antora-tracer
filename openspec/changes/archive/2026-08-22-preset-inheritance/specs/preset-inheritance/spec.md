# preset-inheritance

## Purpose

A preset SHALL be able to extend another preset, deep-merging the parent's traceability configuration (roles, relations, matrices, inverse labels) under the child's, with the child taking precedence on conflict.

## ADDED Requirements

### Requirement: Preset extends a parent by top-level `extends`
A preset SHALL declare its parent with a top-level `extends` field (sibling of `name`, `version`, `description`). When a preset declares `extends`, the resolved preset SHALL include the parent's `traceability` deep-merged under the child's own `traceability`.

#### Scenario: Parent roles and relations are inherited
- **WHEN** a preset declares `extends: requirements-engineering` and defines no roles of its own
- **THEN** the resolved preset SHALL contain every role from `requirements-engineering`
- **AND** SHALL contain the parent's relations

#### Scenario: Child overrides parent
- **WHEN** a preset extends a parent and defines a role, relation, matrix, or inverse label that the parent also defines
- **THEN** the child's value SHALL take precedence

### Requirement: Merge semantics match config-file `extends`
Preset inheritance SHALL use the same merge rules as a config file extending a preset: roles are unioned, relations are deep-merged by source and target role, matrices are overridden by `name`, and `inverseLabels` are overridden key-by-key.

#### Scenario: Matrix with the same name is replaced
- **WHEN** a child preset defines a matrix whose `name` matches a parent matrix
- **THEN** the resolved preset SHALL contain exactly one matrix with that name, holding the child's definition

#### Scenario: New matrices are added
- **WHEN** a child preset defines a matrix not present in the parent
- **THEN** the resolved preset SHALL contain both the parent's matrices and the child's new matrix

### Requirement: Transitive inheritance
Inheritance SHALL resolve transitively: a preset extending a preset that itself extends another SHALL include the roles, relations, and matrices of the full chain.

#### Scenario: Three-level chain
- **WHEN** preset A extends preset B and preset B extends preset C
- **THEN** loading preset A SHALL include C's roles and relations merged under B's, then under A's

### Requirement: Missing parent is reported
When a preset's `extends` names a preset that cannot be resolved, loading SHALL fail with an error that names the missing preset.

#### Scenario: Extending an unknown preset
- **WHEN** a preset declares `extends: does-not-exist`
- **THEN** `loadPreset` SHALL throw an error stating the preset was not found
- **AND** the resolved preset SHALL NOT be returned or cached

### Requirement: Circular inheritance is rejected
A preset SHALL NOT extend itself, directly or transitively. Any inheritance cycle SHALL be detected and rejected with a clear error rather than looping indefinitely.

#### Scenario: Self-extension
- **WHEN** a preset declares `extends` with its own name
- **THEN** loading SHALL throw a circular-inheritance error

#### Scenario: Mutual extension
- **WHEN** preset A extends B and preset B extends A
- **THEN** loading either preset SHALL throw a circular-inheritance error
