## MODIFIED Requirements

### Requirement: Inline macros inside verbatim blocks are preserved in rendered output
The system SHALL preserve inline relationship macros (`relation:TARGET[]`) inside AsciiDoc verbatim blocks so they remain visible in the rendered output.

#### Scenario: Verbatim inline macros remain visible
- **WHEN** an item block inside a verbatim block contains an inline relationship macro
- **THEN** the macro SHALL remain visible in the rendered output
