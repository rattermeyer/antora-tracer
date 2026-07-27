## ADDED Requirements

### Requirement: Single [item] macro replaces all block macros

The system SHALL use a single `[item]` block macro to define all traceable artifacts, replacing the previous `[req]`, `[imp]`, `[test]`, and `[doc]` macros.

#### Scenario: Define a requirement using new syntax
- **WHEN** a user defines `[item, id=REQ-001, role=requirement]` in AsciiDoc
- **THEN** system parses it as a requirement artifact
- **AND** system stores it with id `REQ-001` and role `requirement`

#### Scenario: Define a design concept using new syntax
- **WHEN** a user defines `[item, id=DC-001, role=design]` in AsciiDoc
- **THEN** system parses it as a design artifact
- **AND** system stores it with id `DC-001` and role `design`

#### Scenario: Define a test using new syntax
- **WHEN** a user defines `[item, id=TEST-001, role=test]` in AsciiDoc
- **THEN** system parses it as a test artifact
- **AND** system stores it with id `TEST-001` and role `test`

### Requirement: [item] macro accepts role attribute

The `[item]` macro SHALL accept a `role` attribute that specifies the type of traceable artifact.

#### Scenario: Item with role attribute
- **WHEN** an `[item]` macro includes `role=requirement`
- **THEN** system assigns the `requirement` role to the item
- **AND** system uses this role for validation and graph building

#### Scenario: Item without role attribute
- **WHEN** an `[item]` macro does not include a `role` attribute
- **THEN** system assigns a default role of `unknown`
- **AND** system generates a warning about missing role

### Requirement: [item] macro maintains all existing attributes

The `[item]` macro SHALL support all existing attributes from the previous macros: `id`, `title`, `status`, and custom attributes.

#### Scenario: Item with title attribute
- **WHEN** an `[item, id=REQ-001, role=requirement, title="User Auth"]` is defined
- **THEN** system stores the title as "User Auth"
- **AND** system uses the title in generated matrices

#### Scenario: Item with status attribute
- **WHEN** an `[item, id=REQ-001, role=requirement, status=open]` is defined
- **THEN** system stores the status as `open`
- **AND** system uses the status in coverage calculations

### Requirement: [item] macro supports block content

The `[item]` macro SHALL accept block content (text between `====` delimiters) as the artifact description.

#### Scenario: Item with multi-line content
- **WHEN** an `[item]` macro has content spanning multiple lines
- **THEN** system preserves all content lines
- **AND** system renders the content in generated output

#### Scenario: Item with AsciiDoc formatting
- **WHEN** an `[item]` macro contains AsciiDoc formatting (bold, italics, lists)
- **THEN** system preserves the AsciiDoc markup
- **AND** system renders it correctly in HTML output

### Requirement: Old macro syntax generates error

The system SHALL generate a clear error when old macro syntax (`[req]`, `[imp]`, `[test]`, `[doc]`) is used.

#### Scenario: Using old [req] macro
- **WHEN** a user defines `[req, id=REQ-001]` in AsciiDoc
- **THEN** system generates an error
- **AND** error message indicates the macro is deprecated and suggests using `[item, role=requirement]`

#### Scenario: Using old [imp] macro
- **WHEN** a user defines `[imp, id=IMP-001]` in AsciiDoc
- **THEN** system generates an error
- **AND** error message indicates the macro is deprecated and suggests using `[item, role=design]`
