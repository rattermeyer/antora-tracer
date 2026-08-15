## ADDED Requirements

### Requirement: Inverse labels are config-driven
The system SHALL support `inverseLabels` in the traceability configuration YAML, mapping each relation type to its inverse display label for `traceability:incoming[]` rendering.

### Requirement: Fallback to built-in inverse label mapping
If no `inverseLabels` config entry is defined for a relation type, then the system SHALL use the built-in inverse label mapping for that type.

### Requirement: Fallback to raw type name when no mapping exists
If a relation type has no entry in `inverseLabels` and no built-in inverse mapping, then the system SHALL display the raw relation type name.

#### Scenario: Config-defined inverse label used
- **WHEN** `traceability.yml` defines `inverseLabels: { refines: "refined-by" }`
- **AND** a page uses `traceability:incoming[]` on an item with an incoming `refines` relationship
- **THEN** the rendered output shows "Refined-by" as the group heading

#### Scenario: Fallback to compile-time map
- **WHEN** a relation type has no entry in `inverseLabels`
- **AND** the type exists in `types.ts` INVERSE_MAP
- **THEN** the compile-time inverse label is used

#### Scenario: Fallback to raw type
- **WHEN** a relation type has no entry in `inverseLabels` or INVERSE_MAP
- **THEN** the raw relation type name is displayed as-is
