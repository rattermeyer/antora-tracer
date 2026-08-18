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
