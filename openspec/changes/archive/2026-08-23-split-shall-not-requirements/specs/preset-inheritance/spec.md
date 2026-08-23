## REMOVED Requirements

### Requirement: Circular inheritance is rejected

## ADDED Requirements

### Requirement: A preset does not extend itself
A preset SHALL NOT extend itself, directly or transitively.

#### Scenario: Self-extension is rejected
- **WHEN** a preset declares `extends` with its own name
- **THEN** validation SHALL report an error

### Requirement: Inheritance cycles are detected and rejected
When a preset inheritance chain forms a cycle, the system SHALL detect it and report a clear error rather than looping indefinitely.

#### Scenario: Mutual extension is rejected
- **WHEN** preset A extends B and preset B extends A
- **THEN** the system SHALL report a circular-inheritance error
