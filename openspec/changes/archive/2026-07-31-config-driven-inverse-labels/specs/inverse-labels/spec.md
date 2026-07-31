## ADDED Requirements

### Requirement: Inverse labels are config-driven
The system SHALL support `inverseLabels` in the traceability configuration YAML, mapping each relation type to its inverse display label for `traceability:incoming[]` rendering. When no config label is defined, the system SHALL fall back to the compile-time `INVERSE_MAP` in `types.ts`, then to the raw relation type name.

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
