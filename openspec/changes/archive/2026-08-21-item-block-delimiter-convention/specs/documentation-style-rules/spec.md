## ADDED Requirements

### Requirement: Item blocks use the open-block delimiter
Item block examples in the documentation SHALL use the `--` open-block delimiter as the canonical form. The `====` example-block delimiter SHALL be documented as a valid alternative with its rendering difference.

#### Scenario: Prose examples use open-block delimiters
- **WHEN** a tutorial, how-to, or reference page shows an `[item]` block
- **THEN** the block SHALL use `--` as its delimiter

#### Scenario: Alternative delimiter is documented
- **WHEN** a reader views the item macro reference
- **THEN** it SHALL state that `====` also works
- **AND** it SHALL describe the rendering difference between open blocks (inline, no frame) and example blocks (boxed, shaded)
