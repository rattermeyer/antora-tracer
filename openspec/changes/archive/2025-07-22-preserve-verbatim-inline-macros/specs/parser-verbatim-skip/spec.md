## ADDED Requirements

### Requirement: Inline macros inside verbatim blocks are preserved in rendered output
The system SHALL NOT strip inline relationship macros (`relation:TARGET[]`) from inside AsciiDoc verbatim blocks during the content substitution pass. Such macros are example code and SHALL remain visible in the rendered output.

#### Scenario: Inline macro inside a source block
- **WHEN** a `[source,asciidoc]` block contains `satisfies:REQ-001[]` as example code
- **THEN** the text `satisfies:REQ-001[]` remains in the rendered output

#### Scenario: Inline macro outside a source block is still stripped
- **WHEN** `satisfies:REQ-001[]` appears in real AsciiDoc content (not inside a verbatim block)
- **THEN** the text is stripped from the rendered output

#### Scenario: Mixed content with verbatim block
- **WHEN** a page contains inline macros both inside and outside a `----` block
- **THEN** macros outside the block are stripped
- **AND** macros inside the block are preserved
