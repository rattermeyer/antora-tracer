# documentation-style-rules

## Purpose

Provide reusable Vale rules for the machine-checkable parts of the project's documentation style guide.
## Requirements
### Requirement: Reusable Vale rules encode the style guide
The system SHALL provide a set of Vale rule files that encode the machine-checkable parts of the documentation style guide, including filler-word avoidance, inclusive language, non-militaristic language, and the instead-of/use substitutions.

#### Scenario: Filler words are flagged
- **WHEN** prose contains a filler word such as "please", "just", "simply", "obviously", or "easily"
- **THEN** a Vale rule reports it

#### Scenario: Inclusive-language violations are flagged
- **WHEN** prose contains an ableist or gendered term from the style guide
- **THEN** a Vale rule reports it

#### Scenario: Non-militaristic substitutions are flagged
- **WHEN** prose contains a militaristic metaphor such as "war room" or "kill switch"
- **THEN** a Vale rule reports it with the suggested replacement

### Requirement: Rules are packaged with the extension
The system SHALL ship the rule files and a sample configuration with the npm package, while remaining optional for users.

#### Scenario: Starter style is available
- **WHEN** the package is installed
- **THEN** the rule files and sample Vale configuration are present and usable

### Requirement: Item blocks use the open-block delimiter
Item block examples in the documentation SHALL use the `--` open-block delimiter as the canonical form. The `====` example-block delimiter SHALL be documented as a valid alternative with its rendering difference.

#### Scenario: Prose examples use open-block delimiters
- **WHEN** a tutorial, how-to, or reference page shows an `[item]` block
- **THEN** the block SHALL use `--` as its delimiter

#### Scenario: Alternative delimiter is documented
- **WHEN** a reader views the item macro reference
- **THEN** it SHALL state that `====` also works
- **AND** it SHALL describe the rendering difference between open blocks (inline, no frame) and example blocks (boxed, shaded)

